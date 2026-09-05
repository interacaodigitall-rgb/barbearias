import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  pt: {
    translation: {
      "home": "Início",
      "booking": "Agendar",
      "appointments": "Meus Agendamentos",
      "loyalty": "Fidelidade",
      "profile": "Perfil",
      "admin": "Painel Admin",
      "barber_dashboard": "Minha Agenda",
      "logout": "Sair",
      "welcome": "Bem-vindo, {{name}}!",
      "ready_to_cut": "Pronto para dar aquele trato no visual?",
      "new_booking": "Novo Agendamento",
      "choose_service": "Escolha serviço e horário",
      "your_points": "Seus Pontos",
      "points_accumulated": "{{points}} pontos acumulados",
      "next_appointments": "Próximos Agendamentos",
      "see_all": "Ver todos",
      "no_appointments": "Nenhum agendamento",
      "no_appointments_desc": "Você não tem agendamentos futuros.",
      "login_title": "Entre na sua conta ou use o modo demo",
      "email": "Email",
      "password": "Senha",
      "login_btn": "Entrar",
      "creating_account": "Criar conta",
      "branch": "Unidade",
      "service": "Serviço",
      "professional": "Profissional",
      "date": "Data",
      "time": "Horário",
      "payment": "Pagamento no Local",
      "confirm_booking": "Confirmar Agendamento",
      "status_pending": "Pendente",
      "status_confirmed": "Confirmado",
      "status_completed": "Concluído",
      "status_cancelled": "Cancelado",
      "cancel": "Cancelar",
      "edit": "Editar",
      "save": "Salvar",
      "add": "Adicionar"
    }
  },
  es: {
    translation: {
      "home": "Inicio",
      "booking": "Reservar",
      "appointments": "Mis Reservas",
      "loyalty": "Fidelidad",
      "profile": "Perfil",
      "admin": "Panel Admin",
      "barber_dashboard": "Mi Agenda",
      "logout": "Salir",
      "welcome": "¡Bienvenido, {{name}}!",
      "ready_to_cut": "¿Listo para un cambio de look?",
      "new_booking": "Nueva Reserva",
      "choose_service": "Elige servicio y horario",
      "your_points": "Tus Puntos",
      "points_accumulated": "{{points}} puntos acumulados",
      "next_appointments": "Próximas Reservas",
      "see_all": "Ver todas",
      "no_appointments": "Sin reservas",
      "no_appointments_desc": "No tienes reservas futuras.",
      "login_title": "Inicia sesión en tu cuenta o usa el modo demo",
      "email": "Correo",
      "password": "Contraseña",
      "login_btn": "Entrar",
      "creating_account": "Crear cuenta",
      "branch": "Sucursal",
      "service": "Servicio",
      "professional": "Profesional",
      "date": "Fecha",
      "time": "Hora",
      "payment": "Pago en el Local",
      "confirm_booking": "Confirmar Reserva",
      "status_pending": "Pendiente",
      "status_confirmed": "Confirmado",
      "status_completed": "Completado",
      "status_cancelled": "Cancelado",
      "cancel": "Cancelar",
      "edit": "Editar",
      "save": "Guardar",
      "add": "Añadir"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "pt", // default language
    fallbackLng: "pt",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
