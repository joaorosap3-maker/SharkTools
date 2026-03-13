import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: string;
  rental: any;
}

export default function Calendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [rentals, setRentals] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    buscarLocacoes();
  }, []);

  const buscarLocacoes = () => {
    const storedRentals = JSON.parse(localStorage.getItem('rentals') || '[]');
    const storedClients = JSON.parse(localStorage.getItem('clients') || '[]');
    const storedTools = JSON.parse(localStorage.getItem('tools') || '[]');
    setRentals(storedRentals);
    setClients(storedClients);
    setTools(storedTools);
    mapearLocacoesParaEventos(storedRentals, storedClients, storedTools);
  };

  const mapearLocacoesParaEventos = (rentalsData: any[], clientsData: any[], toolsData: any[]) => {
    const mappedEvents: CalendarEvent[] = rentalsData.map(rental => {
      const client = clientsData.find(c => c.id === rental.clientId);
      const clientName = client ? client.name.split(' ')[0] : 'Desconhecido';
      
      const toolNames = rental.items?.map((item: any) => {
        const tool = toolsData.find(t => t.id === item.toolId);
        return tool ? tool.name.split(' ')[0] : 'Item';
      }).join(', ') || 'Item';

      // Fix timezone issues by appending time
      const startDate = new Date(`${rental.startDate}T12:00:00`);
      const endDate = new Date(`${rental.endDate}T12:00:00`);

      return {
        id: rental.id,
        title: `${clientName} - ${toolNames}`,
        start: startDate,
        end: endDate,
        status: rental.status,
        rental: rental
      };
    });
    setEvents(mappedEvents);
  };

  const abrirEvento = (evento: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(evento);
  };

  const fecharEvento = () => {
    setSelectedEvent(null);
  };

  const handleDayClick = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    navigate(`/locacoes/nova?date=${dateString}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-500';
      case 'reservada': return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-500';
      case 'finalizada': return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-500';
      case 'atrasada': return 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-500';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-500';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDateStr = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Calendar Logic
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonthDays = getDaysInMonth(year, month - 1);
  const days = [];

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true
    });
  }

  // Next month days to complete the grid (42 cells = 6 rows)
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false
    });
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.start);
      eventStart.setHours(0, 0, 0, 0);
      const eventEnd = new Date(event.end);
      eventEnd.setHours(23, 59, 59, 999);
      const checkDate = new Date(date);
      checkDate.setHours(12, 0, 0, 0);
      return checkDate >= eventStart && checkDate <= eventEnd;
    });
  };

  const nextPeriod = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') newDate.setMonth(newDate.getMonth() + 1);
    if (view === 'week') newDate.setDate(newDate.getDate() + 7);
    if (view === 'day') newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const prevPeriod = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') newDate.setMonth(newDate.getMonth() - 1);
    if (view === 'week') newDate.setDate(newDate.getDate() - 7);
    if (view === 'day') newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const today = () => setCurrentDate(new Date());

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const renderMonthView = () => (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="py-3 px-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider border-r border-slate-200 dark:border-slate-800 last:border-0">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 auto-rows-[120px]">
        {days.map((dayObj, idx) => {
          const dayEvents = getEventsForDate(dayObj.date);
          const isToday = dayObj.date.toDateString() === new Date().toDateString();
          
          return (
            <div 
              key={idx} 
              onClick={() => handleDayClick(dayObj.date)}
              className={`p-2 border-r border-b border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors overflow-y-auto custom-scrollbar
                ${!dayObj.isCurrentMonth ? 'bg-slate-50/30 dark:bg-slate-800/20 text-slate-400' : 'text-slate-700 dark:text-slate-300'}
                ${isToday ? 'bg-primary/5' : ''}
              `}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-sm font-semibold ${isToday ? 'bg-primary text-white size-6 flex items-center justify-center rounded-full' : ''}`}>
                  {dayObj.date.getDate()}
                </span>
              </div>
              <div className="space-y-1">
                {dayEvents.map(event => (
                  <div 
                    key={event.id}
                    onClick={(e) => abrirEvento(event, e)}
                    className={`px-2 py-1 rounded text-[10px] border-l-4 truncate font-medium cursor-pointer hover:opacity-80 ${getStatusColor(event.status)}`}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      weekDays.push(d);
    }

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          {weekDays.map((day, idx) => (
            <div key={idx} className="py-3 px-4 text-center border-r border-slate-200 dark:border-slate-800 last:border-0">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][day.getDay()]}</div>
              <div className={`text-lg font-bold mt-1 ${day.toDateString() === new Date().toDateString() ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 min-h-[400px]">
          {weekDays.map((day, idx) => {
            const dayEvents = getEventsForDate(day);
            return (
              <div 
                key={idx} 
                onClick={() => handleDayClick(day)}
                className="p-2 border-r border-slate-200 dark:border-slate-800 last:border-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="space-y-2 mt-2">
                  {dayEvents.map(event => (
                    <div 
                      key={event.id}
                      onClick={(e) => abrirEvento(event, e)}
                      className={`p-2 rounded text-xs border-l-4 font-medium cursor-pointer hover:opacity-80 ${getStatusColor(event.status)}`}
                    >
                      <div className="font-bold truncate">{event.title}</div>
                      <div className="text-[10px] opacity-80 mt-1">{event.status.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm p-6 min-h-[400px]">
        <h3 className="text-xl font-bold mb-6 text-slate-800 dark:text-slate-200">
          {currentDate.getDate()} de {monthNames[currentDate.getMonth()]} de {currentDate.getFullYear()}
        </h3>
        
        {dayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
            <p>Nenhuma locação para este dia.</p>
            <button 
              onClick={() => handleDayClick(currentDate)}
              className="mt-4 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90"
            >
              Criar Locação
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {dayEvents.map(event => (
              <div 
                key={event.id}
                onClick={(e) => abrirEvento(event, e)}
                className={`p-4 rounded-xl border-l-4 cursor-pointer hover:opacity-90 flex justify-between items-center ${getStatusColor(event.status)}`}
              >
                <div>
                  <h4 className="font-bold text-lg">{event.title}</h4>
                  <p className="text-sm opacity-80 mt-1">
                    Período: {formatDateStr(event.rental.startDate)} até {formatDateStr(event.rental.endDate)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-white/50 dark:bg-black/20 rounded-full text-xs font-bold uppercase mb-2">
                    {event.status}
                  </span>
                  <p className="font-bold">{formatCurrency(event.rental.total)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenda de Locações</h1>
          <p className="text-slate-500 text-sm mt-1">Monitore a disponibilidade e o status dos equipamentos em tempo real.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button onClick={prevPeriod} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button onClick={today} className="px-4 py-2 text-sm font-bold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
              Hoje
            </button>
            <button onClick={nextPeriod} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
          <span className="text-lg font-bold text-slate-800 dark:text-slate-200 min-w-[150px] text-center">
            {view === 'month' && `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
            {view === 'week' && `Semana de ${currentDate.getDate()} ${monthNames[currentDate.getMonth()].substring(0,3)}`}
            {view === 'day' && `${currentDate.getDate()} ${monthNames[currentDate.getMonth()].substring(0,3)}`}
          </span>
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <button 
              onClick={() => setView('day')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${view === 'day' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Dia
            </button>
            <button 
              onClick={() => setView('week')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${view === 'week' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Semana
            </button>
            <button 
              onClick={() => setView('month')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${view === 'month' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Mês
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 py-2 px-1">
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-blue-500"></span>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Ativa</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-emerald-500"></span>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Reservada</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-slate-500"></span>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Finalizada</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-rose-500"></span>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Atrasada</span>
        </div>
      </div>

      {/* Calendar Views */}
      {view === 'month' && renderMonthView()}
      {view === 'week' && renderWeekView()}
      {view === 'day' && renderDayView()}

      {/* Event Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={fecharEvento}>
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800"
            onClick={e => e.stopPropagation()}
          >
            <div className={`p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center ${getStatusColor(selectedEvent.status).split(' ')[0]}`}>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Detalhes da Locação</h3>
              <button onClick={fecharEvento} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cliente</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {clients.find(c => c.id === selectedEvent.rental.clientId)?.name || 'Desconhecido'}
                </p>
              </div>
              
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ferramentas</p>
                <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-300">
                  {selectedEvent.rental.items?.map((item: any, idx: number) => {
                    const tool = tools.find(t => t.id === item.toolId);
                    return <li key={idx}>{item.quantity}x {tool ? tool.name : 'Item Desconhecido'}</li>;
                  })}
                </ul>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Retirada</p>
                  <p className="font-medium text-slate-900 dark:text-white">{formatDateStr(selectedEvent.rental.startDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Devolução</p>
                  <p className="font-medium text-slate-900 dark:text-white">{formatDateStr(selectedEvent.rental.endDate)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</p>
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(selectedEvent.status)} border-0`}>
                    {selectedEvent.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Valor Total</p>
                  <p className="font-bold text-lg text-primary dark:text-white">{formatCurrency(selectedEvent.rental.total)}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button 
                onClick={fecharEvento}
                className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Fechar
              </button>
              <button 
                onClick={() => navigate(`/locacoes/editar/${selectedEvent.id}`)}
                className="px-4 py-2 text-sm font-bold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Editar Locação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
