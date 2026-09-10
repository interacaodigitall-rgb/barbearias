import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { Appointment, Service, Barber, AppointmentProductItem } from '../models';
import { loyaltyService } from './loyaltyService';
import { cashFlowService } from './cashFlowService';
import { firestoreService } from './firestoreService';
import { saasService } from './saasService';
import { useAuthStore } from '../store/authStore';
import { demoAppointments } from '../models/demoData';
import { calculateBarberCommission } from '../utils/commissionUtils';

const DEMO_APPTS_KEY = 'barbearia_demo_appointments_v2';

const getDemoAppts = (): Appointment[] => {
  const saved = localStorage.getItem(DEMO_APPTS_KEY);
  return saved ? JSON.parse(saved) : demoAppointments;
};

const saveDemoAppts = (appts: Appointment[]) => {
  localStorage.setItem(DEMO_APPTS_KEY, JSON.stringify(appts));
};

export const appointmentService = {
  async checkAvailability(barberId: string, date: string, time: string): Promise<boolean> {
    const appts = await this.getAllAppointments();
    const isTaken = appts.some(a => 
      a.barberId === barberId && 
      a.date === date && 
      a.time === time && 
      a.status !== 'cancelled'
    );
    return !isTaken;
  },

  async createAppointment(appointment: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment> {
    const isAvailable = await this.checkAvailability(appointment.barberId, appointment.date, appointment.time);
    if (!isAvailable) {
      throw new Error('Este horário já foi reservado por outro cliente.');
    }

    const newAppointment = {
      ...appointment,
      createdAt: Date.now(),
    };

    if (useAuthStore.getState().isDemo) {
      const appts = getDemoAppts();
      const created: Appointment = { ...newAppointment, id: `demo-${Date.now()}` } as Appointment;
      saveDemoAppts([...appts, created]);
      return created;
    }

    try {
      const docRef = await addDoc(collection(db, 'appointments'), newAppointment);
      return { id: docRef.id, ...newAppointment } as Appointment;
    } catch (err) {
      console.warn('Firestore write error, falling back to local storage:', err);
      const appts = getDemoAppts();
      const created: Appointment = { ...newAppointment, id: `demo-${Date.now()}` } as Appointment;
      saveDemoAppts([...appts, created]);
      return created;
    }
  },

  async cancelAppointment(appointmentId: string, reason: string): Promise<void> {
    if (useAuthStore.getState().isDemo) {
      const appts = getDemoAppts();
      const updated = appts.map(a => a.id === appointmentId ? { ...a, status: 'cancelled', cancellationReason: reason } : a);
      saveDemoAppts(updated as Appointment[]);
      return;
    }
    await updateDoc(doc(db, 'appointments', appointmentId), { 
      status: 'cancelled',
      cancellationReason: reason 
    });
  },

  getLocalAppointments(): Appointment[] {
    return getDemoAppts();
  },

  async getCustomerAppointments(customerId: string): Promise<Appointment[]> {
    if (useAuthStore.getState().isDemo) {
      return getDemoAppts()
        .filter(a => a.customerId === customerId || a.customerId === 'demo-customer')
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    try {
      const q = query(
        collection(db, 'appointments'),
        where('customerId', '==', customerId)
      );
      const snapshot = await getDocs(q);
      const cloudAppts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      
      const localAppts = getDemoAppts().filter(a => a.customerId === customerId);
      const combined = [...cloudAppts];
      for (const loc of localAppts) {
        if (!combined.some(c => c.id === loc.id)) {
          combined.push(loc);
        }
      }
      return combined.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch (err) {
      console.warn('Firestore error in getCustomerAppointments, falling back to local demo appointments:', err);
      return getDemoAppts()
        .filter(a => a.customerId === customerId || a.customerId === 'demo-customer')
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
  },

  async getAllAppointments(barbershopId?: string): Promise<Appointment[]> {
    if (useAuthStore.getState().isDemo) {
      const appts = getDemoAppts();
      if (barbershopId) {
        return appts.filter(a => !a.barbershopId || a.barbershopId === barbershopId);
      }
      return appts;
    }
    try {
      const q = query(collection(db, 'appointments'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const appts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      if (barbershopId) {
        return appts.filter(a => !a.barbershopId || a.barbershopId === barbershopId);
      }
      return appts;
    } catch (err) {
      console.warn('Firestore permission or network error, falling back to local demo appointments:', err);
      const appts = getDemoAppts();
      if (barbershopId) {
        return appts.filter(a => !a.barbershopId || a.barbershopId === barbershopId);
      }
      return appts;
    }
  },

  async updateAppointmentStatus(appointmentId: string, status: Appointment['status'], customerId: string): Promise<void> {
    const [services, barbers] = await Promise.all([
      firestoreService.getServices(),
      firestoreService.getBarbers()
    ]);

    if (useAuthStore.getState().isDemo) {
      const appts = getDemoAppts();
      const appt = appts.find(a => a.id === appointmentId);
      
      let commission_rate = 0;
      let commission_amount = 0;
      let barber_id = appt?.barberId || '';

      if (status === 'completed' && appt) {
        const service = services.find(s => s.id === appt.serviceId) || { id: appt.serviceId, name: 'Serviço', price: appt.totalAmount || 15, durationMinutes: 30 };
        const barber = barbers.find(b => b.id === appt.barberId);
        
        const commCalc = calculateBarberCommission(service.price, appt.date, barber);
        commission_rate = commCalc.commission_rate;
        commission_amount = commCalc.commission_amount;
        barber_id = barber?.id || appt.barberId;
      }

      const updated = appts.map(a => {
        if (a.id === appointmentId) {
          return {
            ...a,
            status,
            paymentStatus: status === 'completed' ? ('paid' as const) : a.paymentStatus,
            commission_rate: status === 'completed' ? commission_rate : a.commission_rate,
            commission_amount: status === 'completed' ? commission_amount : a.commission_amount,
            barber_id: status === 'completed' ? barber_id : a.barber_id
          };
        }
        return a;
      });
      saveDemoAppts(updated);

      if (status === 'completed' && appt) {
        await loyaltyService.addPoints(customerId, 10);
        try {
          const service = services.find(s => s.id === appt.serviceId) || { id: appt.serviceId, name: 'Serviço', price: appt.totalAmount || 15, durationMinutes: 30 };
          const barber = barbers.find(b => b.id === appt.barberId);
          const apptWithCommission: Appointment = {
            ...appt,
            status: 'completed',
            paymentStatus: 'paid',
            commission_rate,
            commission_amount,
            barber_id
          };
          await cashFlowService.registerAppointmentCompletion(apptWithCommission, service as any, barber, appt.barbershopId || saasService.getActiveBarbershop().id);
        } catch (e) {
          console.error('Error auto-recording cash flow:', e);
        }
      }
      return;
    }

    try {
      // In Firestore mode:
      let updatePayload: any = { 
        status,
        paymentStatus: status === 'completed' ? 'paid' : 'pending'
      };

      if (status === 'completed') {
        const appts = await this.getAllAppointments();
        const appt = appts.find(a => a.id === appointmentId);
        if (appt) {
          const service = services.find(s => s.id === appt.serviceId) || { id: appt.serviceId, name: 'Serviço', price: appt.totalAmount || 15, durationMinutes: 30 };
          const barber = barbers.find(b => b.id === appt.barberId);
          const commCalc = calculateBarberCommission(service.price, appt.date, barber);
          
          updatePayload.commission_rate = commCalc.commission_rate;
          updatePayload.commission_amount = commCalc.commission_amount;
          updatePayload.barber_id = barber?.id || appt.barberId;

          const apptWithCommission: Appointment = {
            ...appt,
            ...updatePayload
          };
          await cashFlowService.registerAppointmentCompletion(apptWithCommission, service as any, barber, appt.barbershopId || saasService.getActiveBarbershop().id);
        }
      }

      await updateDoc(doc(db, 'appointments', appointmentId), updatePayload);

      if (status === 'completed') {
        await loyaltyService.addPoints(customerId, 10);
      }
    } catch (err) {
      console.warn('Firestore update error, running fallback:', err);
      // Run fallback
      const appts = getDemoAppts();
      const updated = appts.map(a => a.id === appointmentId ? { ...a, status, paymentStatus: 'paid' as const } : a);
      saveDemoAppts(updated);
    }
  },

  /**
   * Checkout / Baixa de Agendamento pelo Gerente / PDV
   */
  async checkoutAppointment(
    appointmentId: string,
    options: {
      paymentMethod: Appointment['paymentMethod'];
      barberId?: string;
      selectedProducts?: AppointmentProductItem[];
      closedBy?: string;
    }
  ): Promise<Appointment> {
    const [services, barbers] = await Promise.all([
      firestoreService.getServices(),
      firestoreService.getBarbers()
    ]);

    const appts = await this.getAllAppointments();
    const appt = appts.find(a => a.id === appointmentId);
    if (!appt) {
      throw new Error('Agendamento não encontrado.');
    }

    const effectiveBarberId = options.barberId || appt.barberId;
    const barber = barbers.find(b => b.id === effectiveBarberId);
    const service = services.find(s => s.id === appt.serviceId) || { id: appt.serviceId, name: 'Serviço', price: appt.totalAmount || 15, durationMinutes: 30 };
    
    // Dynamic commission calculation based on day of week & contracted vs owner
    const commCalc = calculateBarberCommission(service.price, appt.date, barber);

    // Products
    const products = options.selectedProducts || appt.selectedProducts || [];
    const productsTotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const totalAmount = service.price + productsTotal;

    const completedAppt: Appointment = {
      ...appt,
      barberId: effectiveBarberId,
      status: 'completed',
      paymentStatus: 'paid',
      paymentMethod: options.paymentMethod,
      selectedProducts: products,
      totalAmount,
      commission_rate: commCalc.commission_rate,
      commission_amount: commCalc.commission_amount,
      barber_id: effectiveBarberId,
      closedBy: options.closedBy || 'Gerente',
      closedAt: Date.now()
    };

    // Save in demo state
    const demoAppts = getDemoAppts();
    const existingIndex = demoAppts.findIndex(a => a.id === appointmentId);
    if (existingIndex >= 0) {
      demoAppts[existingIndex] = completedAppt;
      saveDemoAppts(demoAppts);
    } else {
      saveDemoAppts([completedAppt, ...demoAppts]);
    }

    // Try Firestore update
    try {
      await updateDoc(doc(db, 'appointments', appointmentId), {
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: options.paymentMethod,
        selectedProducts: products,
        totalAmount,
        commission_rate: commCalc.commission_rate,
        commission_amount: commCalc.commission_amount,
        barber_id: effectiveBarberId,
        closedBy: options.closedBy || 'Gerente',
        closedAt: Date.now()
      });
    } catch (e) {
      console.warn('Firestore checkout update fallback:', e);
    }

    // Register financial transaction & commission in cash flow
    await cashFlowService.registerAppointmentCompletion(
      completedAppt,
      service as any,
      barber,
      completedAppt.barbershopId || saasService.getActiveBarbershop().id
    );

    // Award loyalty points to customer
    if (completedAppt.customerId && completedAppt.customerId !== 'walk-in-customer') {
      await loyaltyService.addPoints(completedAppt.customerId, 10);
    }

    return completedAppt;
  },

  /**
   * Venda Avulsa / Walk-in sem agendamento prévio (Atendimento de Balcão)
   */
  async createWalkInSale(params: {
    serviceId: string;
    barberId: string;
    paymentMethod: Appointment['paymentMethod'];
    customerName?: string;
    customerPhone?: string;
    selectedProducts?: AppointmentProductItem[];
    notes?: string;
    closedBy?: string;
    barbershopId?: string;
  }): Promise<Appointment> {
    const [services, barbers] = await Promise.all([
      firestoreService.getServices(),
      firestoreService.getBarbers()
    ]);

    const service = services.find(s => s.id === params.serviceId) || services[0] || { id: 'srv-default', name: 'Corte Tradicional', price: 15, durationMinutes: 30 };
    const barber = barbers.find(b => b.id === params.barberId) || barbers[0];

    const todayStr = new Date().toISOString().split('T')[0];
    const nowTimeStr = new Date().toTimeString().slice(0, 5);

    // Dynamic commission calculation
    const commCalc = calculateBarberCommission(service.price, todayStr, barber);

    const products = params.selectedProducts || [];
    const productsTotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const totalAmount = service.price + productsTotal;

    const newAppt: Appointment = {
      id: `walkin-${Date.now()}`,
      customerId: 'walk-in-customer',
      customerName: params.customerName || 'Cliente Balcão (Walk-in)',
      customerPhone: params.customerPhone || '',
      barberId: barber ? barber.id : 'b-rogerx-roger',
      serviceId: service.id,
      date: todayStr,
      time: nowTimeStr,
      status: 'completed',
      paymentStatus: 'paid',
      paymentMethod: params.paymentMethod,
      branch: 'PT',
      barbershopId: params.barbershopId || saasService.getActiveBarbershop().id,
      selectedProducts: products,
      totalAmount,
      commission_rate: commCalc.commission_rate,
      commission_amount: commCalc.commission_amount,
      barber_id: barber ? barber.id : '',
      closedBy: params.closedBy || 'Gerente',
      closedAt: Date.now(),
      isWalkIn: true,
      notes: params.notes,
      createdAt: Date.now()
    };

    // Save to demo
    const current = getDemoAppts();
    saveDemoAppts([newAppt, ...current]);

    // Try Firestore
    try {
      await addDoc(collection(db, 'appointments'), newAppt);
    } catch (e) {
      console.warn('Firestore walk-in save fallback:', e);
    }

    // Register financial transaction & commission in cash flow
    await cashFlowService.registerAppointmentCompletion(
      newAppt,
      service as any,
      barber,
      newAppt.barbershopId
    );

    return newAppt;
  }
};
