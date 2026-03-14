import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCalendar } from '../hooks/useCalendar';

export default function Calendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const { data: events = [], isLoading, isError, refetch } = useCalendar();

  const fecharEvento = () => setSelectedEvent(null);

  const handleDayClick = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    navigate(`/locacoes/nova?date=${dateString}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-500';
      case 'reservada': return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-500';
      case 'finalizada': return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-500';
      case 'atrasada': case 'overdue': return 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-500';
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

  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month - 1, prevMonthDays - i), isCurrentMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
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

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 animate-pulse font-medium">Sincronizando agenda v1.0.3...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Agenda de Locações</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Status real de disponibilidade do inventário v1.0.3.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
             <button onClick={() => setView('day')} className={`px-4 py-1.5 text-sm font-bold rounded-lg ${view === 'day' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}>Dia</button>
             <button onClick={() => setView('week')} className={`px-4 py-1.5 text-sm font-bold rounded-lg ${view === 'week' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}>Semana</button>
             <button onClick={() => setView('month')} className={`px-4 py-1.5 text-sm font-bold rounded-lg ${view === 'month' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}>Mês</button>
          </div>
          
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm">
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth()-1)))} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"><span className="material-symbols-outlined text-lg">chevron_left</span></button>
            <span className="text-sm font-bold px-2 min-w-[120px] text-center">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth()+1)))} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"><span className="material-symbols-outlined text-lg">chevron_right</span></button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-center py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 auto-rows-[120px]">
          {days.map((dayObj, idx) => {
            const dayEvents = getEventsForDate(dayObj.date);
            const isToday = dayObj.date.toDateString() === new Date().toDateString();
            return (
              <div key={idx} onClick={() => handleDayClick(dayObj.date)} className={`p-2 border-r border-b border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors overflow-hidden ${!dayObj.isCurrentMonth ? 'opacity-30' : ''} ${isToday ? 'bg-primary/5' : ''}`}>
                <div className="flex justify-between items-center mb-1">
                   <span className={`text-sm font-bold ${isToday ? 'bg-primary text-white size-6 flex items-center justify-center rounded-full' : 'text-slate-900 dark:text-slate-300'}`}>{dayObj.date.getDate()}</span>
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div key={event.id} onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }} className={`px-2 py-0.5 rounded text-[10px] border-l-2 truncate font-bold ${getStatusColor(event.status)}`}>
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && <div className="text-[9px] text-slate-400 font-bold px-1">+{dayEvents.length - 3} mais</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Detalhes */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={fecharEvento}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 relative">
              <h3 className="font-bold text-xl text-slate-900 dark:text-white">Detalhes da Locação</h3>
              <p className="text-sm text-slate-500">ID: #{selectedEvent.id.substring(0,8).toUpperCase()}</p>
              <button onClick={fecharEvento} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
            </div>
            
            <div className="p-6 space-y-5">
               <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <div className="size-12 bg-primary/10 text-primary flex items-center justify-center rounded-xl font-bold text-xl">{selectedEvent.rental.clients?.name.charAt(0)}</div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Locatário</p>
                    <p className="font-bold text-slate-900 dark:text-white">{selectedEvent.rental.clients?.name}</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl">
                     <p className="text-xs font-bold text-slate-400 uppercase mb-1">Início</p>
                     <p className="font-bold text-slate-900 dark:text-white">{formatDateStr(selectedEvent.rental.startDate)}</p>
                  </div>
                  <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl">
                     <p className="text-xs font-bold text-slate-400 uppercase mb-1">Retorno</p>
                     <p className="font-bold text-slate-900 dark:text-white">{formatDateStr(selectedEvent.rental.endDate)}</p>
                  </div>
               </div>

               <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Equipamento</p>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedEvent.rental.equipment_assets?.name}</p>
                  <div className="mt-4 flex items-center justify-between">
                     <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(selectedEvent.status)}`}>{selectedEvent.status}</span>
                     <p className="font-bold text-xl text-primary">{formatCurrency(selectedEvent.rental.total)}</p>
                  </div>
               </div>
            </div>

            <div className="p-6 flex gap-3">
              <button onClick={() => navigate(`/locacoes/editar/${selectedEvent.id}`)} className="flex-1 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                 <span className="material-symbols-outlined text-lg">edit</span> Editar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
