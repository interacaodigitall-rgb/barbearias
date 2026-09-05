import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { Appointment } from '../models';
import { loyaltyService } from './loyaltyService';
import { cashFlowService } from './cashFlowService';
import { firestoreService } from './firestoreService';
import { useAuthStore } from '../store/authStore';
import { demoAppointments } from '../models/demoData';

const DEMO_APPTS_KEY = 'barbearia_demo_appointments';

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

    const docRef = await addDoc(collection(db, 'appointments'), newAppointment);
    return { id: docRef.id, ...newAppointment } as Appointment;
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

  async getCustomerAppointments(customerId: string): Promise<Appointment[]> {
    if (useAuthStore.getState().isDemo) {
      return getDemoAppts().filter(a => a.customerId === customerId);
    }
    const q = query(
      collection(db, 'appointments'),
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
  },

  async getAllAppointments(): Promise<Appointment[]> {
    if (useAuthStore.getState().isDemo) {
      return getDemoAppts();
    }
    const q = query(collection(db, 'appointments'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
  },

  async updateAppointmentStatus(appointmentId: string, status: Appointment['status'], customerId: string): Promise<void> {
    if (useAuthStore.getState().isDemo) {
      const appts = getDemoAppts();
      const appt = appts.find(a => a.id === appointmentId);
      const updated = appts.map(a => a.id === appointmentId ? { ...a, status, paymentStatus: status === 'completed' ? 'paid' : a.paymentStatus } : a);
      saveDemoAppts(updated);
      if (status === 'completed') {
        await loyaltyService.addPoints(customerId, 10);
        if (appt) {
          try {
            const [services, barbers] = await Promise.all([
              firestoreService.getServices(),
              firestoreService.getBarbers()
            ]);
            const service = services.find(s => s.id === appt.serviceId) || { id: appt.serviceId, name: 'Serviço', price: appt.totalAmount || 15, durationMinutes: 30 };
            const barber = barbers.find(b => b.id === appt.barberId);
            await cashFlowService.registerAppointmentCompletion(appt, service as any, barber, appt.barbershopId || 'shop-mister-navalha');
          } catch (e) {
            console.error('Error auto-recording cash flow:', e);
          }
        }
      }
      return;
    }

    await updateDoc(doc(db, 'appointments', appointmentId), { 
      status,
      paymentStatus: status === 'completed' ? 'paid' : 'pending'
    });
    if (status === 'completed') {
      await loyaltyService.addPoints(customerId, 10);
    }
  }
};
