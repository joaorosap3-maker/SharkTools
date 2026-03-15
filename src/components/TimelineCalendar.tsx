import React, { useMemo } from 'react';
import { useMasterData } from '../hooks/useMasterData';

interface TimelineCalendarProps {
  currentDate: Date;
  range: 'week' | 'month';
  events: any[];
  onEventClick: (event: any) => void;
}

export default function TimelineCalendar({ currentDate, range, events, onEventClick }: TimelineCalendarProps) {
  const { useEquipment } = useMasterData();
  const { data: equipment = [], isLoading } = useEquipment();

  const days = useMemo(() => {
    const dates: Date[] = [];
    if (range === 'week') {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay()); // Start at Sunday
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(d);
      }
    } else {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const numDays = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= numDays; i++) {
        dates.push(new Date(year, month, i));
      }
    }
    return dates;
  }, [currentDate, range]);

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  };

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  const getEventsForEquipmentAndDate = (eqId: string, date: Date) => {
    return events.filter(event => {
      if (event.equipment_id !== eqId) return false;
      const start = new Date(event.start);
      start.setHours(0, 0, 0, 0);
      const end = new Date(event.end);
      end.setHours(23, 59, 59, 999);
      const check = new Date(date);
      check.setHours(12, 0, 0, 0);
      return check >= start && check <= end;
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 animate-pulse font-medium">Carregando equipamentos...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      {/* Header Row */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
        <div className="min-w-[200px] border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 font-bold text-xs text-slate-400 uppercase tracking-widest flex items-center">
          Equipamento
        </div>
        <div className="flex flex-1">
          {days.map((date, idx) => (
            <div 
              key={idx} 
              className={`min-w-[100px] flex-1 border-r border-slate-200 dark:border-slate-800 p-3 text-center space-y-1 ${isToday(date) ? 'bg-primary/5' : ''}`}
            >
              <p className="text-[10px] font-bold text-slate-400 uppercase">{getDayName(date)}</p>
              <p className={`text-sm font-bold ${isToday(date) ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                {date.getDate()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Equipment Rows */}
      <div className="overflow-y-auto max-h-[600px]">
        {equipment.map((eq: any) => (
          <div key={eq.id} className="flex border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
            <div className="min-w-[200px] border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-center">
              <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{eq.name}</p>
              <p className="text-[10px] text-slate-500 font-medium">#{eq.code || eq.id.substring(0,6)}</p>
            </div>
            <div className="flex flex-1">
              {days.map((date, idx) => {
                const dayEvents = getEventsForEquipmentAndDate(eq.id, date);
                const isFree = dayEvents.length === 0;
                
                return (
                  <div 
                    key={idx} 
                    className={`min-w-[100px] flex-1 border-r border-slate-100 dark:border-slate-800 p-1 relative h-16 group ${isToday(date) ? 'bg-primary/5' : ''}`}
                  >
                    {isFree ? (
                      <div className="w-full h-full rounded-lg bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors flex items-center justify-center">
                         <div className="size-1.5 bg-emerald-500/20 rounded-full"></div>
                      </div>
                    ) : (
                      <div className="space-y-1 h-full flex flex-col justify-center">
                        {dayEvents.map(event => (
                          <div 
                            key={event.id}
                            onClick={() => onEventClick(event)}
                            className={`
                              px-2 py-1 rounded-lg text-[9px] font-bold truncate cursor-pointer transition-transform hover:scale-[1.02] border-l-2
                              ${event.type === 'maintenance' 
                                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-500' 
                                : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-500'}
                            `}
                            title={`${event.type === 'rental' ? 'Locação' : 'Manutenção'}: ${event.title}`}
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="truncate">{event.type === 'maintenance' ? '🚧 MANUT.' : event.data?.clients?.name || 'Cliente'}</span>
                              <span className="opacity-70 text-[8px]">{new Date(event.start).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})} - {new Date(event.end).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
