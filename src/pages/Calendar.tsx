import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCalendar } from '../hooks/useCalendar';
import TimelineCalendar from '../components/TimelineCalendar';

export default function Calendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'timeline'>('month');
  const [timelineRange, setTimelineRange] = useState<'week' | 'month'>('week');
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const dateRange = useMemo(() => {
    if (view === 'month') {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      return { start, end };
    } else if (timelineRange === 'week') {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start, end };
    } else {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      return { start, end };
    }
  }, [currentDate, view, timelineRange]);

  const { data: events = [], isLoading } = useCalendar(dateRange);

  const fecharEvento = () => setSelectedEvent(null);

  const handleDayClick = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    navigate(`/locacoes/nova?date=${dateString}`);
  };

  const getEventStyle = (event: any) => {
    if (event.type === 'maintenance') {
      return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-500';
    }
    
    // Rentals
    switch (event.status) {
      case 'active': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-500';
      case 'completed': return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-500';
      case 'overdue': return 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-500';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-500';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDateStr = (dateString: string | undefined | null) => {
    if (!dateString) return '---';
    const cleanDate = dateString.split('T')[0];
    const [year, month, day] = cleanDate.split('-');
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
        <p className="text-slate-500 animate-pulse font-medium">Sincronizando agenda de disponibilidade...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Agenda & Disponibilidade</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Visualize locações e manutenções em tempo real.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
             <button onClick={() => setView('month')} className={`px-4 py-1.5 text-sm font-bold rounded-lg ${view === 'month' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}>Calendário</button>
             <button onClick={() => setView('timeline')} className={`px-4 py-1.5 text-sm font-bold rounded-lg ${view === 'timeline' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}>Linha do Tempo</button>
          </div>

          {view === 'timeline' && (
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button onClick={() => setTimelineRange('week')} className={`px-4 py-1.5 text-sm font-bold rounded-lg ${timelineRange === 'week' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}>Semana</button>
              <button onClick={() => setTimelineRange('month')} className={`px-4 py-1.5 text-sm font-bold rounded-lg ${timelineRange === 'month' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}>Mês</button>
            </div>
          )}
          
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm">
            <button 
              onClick={() => {
                const newDate = new Date(currentDate);
                if (view === 'month' || (view === 'timeline' && timelineRange === 'month')) {
                  newDate.setMonth(newDate.getMonth() - 1);
                } else {
                  newDate.setDate(newDate.getDate() - 7);
                }
                setCurrentDate(newDate);
              }} 
              className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            
            <span className="text-sm font-bold px-2 min-w-[120px] text-center">
              {view === 'timeline' && timelineRange === 'week' ? (
                `Semana de ${currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`
              ) : (
                `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              )}
            </span>

            <button 
              onClick={() => {
                const newDate = new Date(currentDate);
                if (view === 'month' || (view === 'timeline' && timelineRange === 'month')) {
                  newDate.setMonth(newDate.getMonth() + 1);
                } else {
                  newDate.setDate(newDate.getDate() + 7);
                }
                setCurrentDate(newDate);
              }} 
              className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>

            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-xs font-bold bg-primary text-white rounded-lg hover:bg-primary/90 ml-1">Hoje</button>
          </div>
        </div>
      </div>

      {view === 'month' ? (
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
                     {dayObj.isCurrentMonth && dayEvents.length === 0 && <span className="size-1.5 bg-emerald-500 rounded-full" title="Disponível"></span>}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <div key={`${event.type}-${event.id}`} onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }} className={`px-2 py-0.5 rounded text-[10px] border-l-2 truncate font-bold ${getEventStyle(event)}`}>
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
      ) : (
        <TimelineCalendar 
          currentDate={currentDate}
          range={timelineRange}
          events={events}
          onEventClick={setSelectedEvent}
        />
      )}

      <div className="flex items-center gap-6 px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
        <div className="flex items-center gap-2"><span className="size-3 bg-blue-500 rounded-full"></span> Locações</div>
        <div className="flex items-center gap-2"><span className="size-3 bg-amber-500 rounded-full"></span> Manutenções</div>
        <div className="flex items-center gap-2"><span className="size-3 bg-emerald-500 rounded-full"></span> Disponível</div>
      </div>

      {/* Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={fecharEvento}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className={`p-6 border-b border-slate-100 dark:border-slate-800 relative ${selectedEvent.type === 'maintenance' ? 'bg-amber-50/50 dark:bg-amber-900/20' : ''}`}>
              <h3 className="font-bold text-xl text-slate-900 dark:text-white">
                {selectedEvent.type === 'maintenance' ? '🚧 Ordem de Manutenção' : '📋 Detalhes da Locação'}
              </h3>
              <p className="text-sm text-slate-500">ID: #{selectedEvent.id.substring(0,8).toUpperCase()}</p>
              <button onClick={fecharEvento} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
            </div>
            
            <div className="p-6 space-y-5">
              {selectedEvent.type === 'rental' ? (
                <>
                  <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <div className="size-12 bg-primary/10 text-primary flex items-center justify-center rounded-xl font-bold text-xl">{selectedEvent.data.clients?.name.charAt(0)}</div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Locatário</p>
                      <p className="font-bold text-slate-900 dark:text-white">{selectedEvent.data.clients?.name}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl">
                       <p className="text-xs font-bold text-slate-400 uppercase mb-1">Início</p>
                       <p className="font-bold text-slate-900 dark:text-white">{formatDateStr(selectedEvent.data.start_date)}</p>
                    </div>
                    <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl">
                       <p className="text-xs font-bold text-slate-400 uppercase mb-1">Retorno</p>
                       <p className="font-bold text-slate-900 dark:text-white">{formatDateStr(selectedEvent.data.end_date)}</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl">
                    <div className="size-12 bg-amber-500/10 text-amber-600 flex items-center justify-center rounded-xl">
                      <span className="material-symbols-outlined">build</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-600/60 uppercase tracking-tighter">Equipamento</p>
                      <p className="font-bold text-slate-900 dark:text-white">{selectedEvent.data.equipmentName}</p>
                    </div>
                  </div>
                  <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Problema / Título</p>
                    <p className="font-bold text-slate-900 dark:text-white">{selectedEvent.data.title}</p>
                    <p className="text-xs text-slate-500 mt-2">{selectedEvent.data.description || 'Sem descrição.'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl">
                       <p className="text-xs font-bold text-slate-400 uppercase mb-1">Início</p>
                       <p className="font-bold text-slate-900 dark:text-white">{formatDateStr(selectedEvent.data.start_date)}</p>
                    </div>
                    <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl">
                       <p className="text-xs font-bold text-slate-400 uppercase mb-1">Previsão</p>
                       <p className="font-bold text-slate-900 dark:text-white">{formatDateStr(selectedEvent.data.end_date)}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 flex gap-3">
              <button 
                onClick={() => navigate(selectedEvent.type === 'rental' ? `/locacoes/editar/${selectedEvent.id}` : `/manutencoes/editar/${selectedEvent.id}`)} 
                className="flex-1 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold rounded-2xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
              >
                 <span className="material-symbols-outlined text-lg">edit</span> Ver Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
