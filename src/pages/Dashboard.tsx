import React, { useEffect, useState } from "react";
import { getDashboardStats } from "../services/dashboardService";

type Rental = {
  id: string;
  start_date: string;
  status: string;
  clients?: { name: string } | null;
  equipment_assets?: { name: string } | null;
};

type Stats = {
  faturamentoMensal: { mes: string; total: number }[];
  totalClientes: number;
  totalEquipamentos: number;
  totalLocacoes: number;
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    faturamentoMensal: [],
    totalClientes: 0,
    totalEquipamentos: 0,
    totalLocacoes: 0,
  });

  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);

      const data = await getDashboardStats();

      if (data) {
        setStats({
          faturamentoMensal: data.faturamentoMensal || [],
          totalClientes: data.totalClientes || 0,
          totalEquipamentos: data.totalEquipamentos || 0,
          totalLocacoes: data.totalLocacoes || 0,
        });

        setRentals(data.recentRentals || []);
      }
    } catch (error) {
      console.error("Dashboard error loading Data", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">Carregando dashboard...</h2>
      </div>
    );
  }

  const faturamentoMensal = stats.faturamentoMensal || [];

  const maxFaturamento =
    faturamentoMensal.length > 0
      ? Math.max(...faturamentoMensal.map((m) => m.total), 1)
      : 1;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow rounded p-4">
          <p className="text-gray-500">Clientes</p>
          <h2 className="text-2xl font-bold">{stats.totalClientes}</h2>
        </div>

        <div className="bg-white shadow rounded p-4">
          <p className="text-gray-500">Equipamentos</p>
          <h2 className="text-2xl font-bold">{stats.totalEquipamentos}</h2>
        </div>

        <div className="bg-white shadow rounded p-4">
          <p className="text-gray-500">Locações</p>
          <h2 className="text-2xl font-bold">{stats.totalLocacoes}</h2>
        </div>
      </div>

      {/* GRÁFICO SIMPLES */}
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-lg font-semibold mb-4">Faturamento mensal</h2>

        {faturamentoMensal.length === 0 ? (
          <p className="text-gray-500">Sem dados de faturamento.</p>
        ) : (
          <div className="space-y-2">
            {faturamentoMensal.map((mes) => {
              const largura = (mes.total / maxFaturamento) * 100;

              return (
                <div key={mes.mes}>
                  <div className="flex justify-between text-sm">
                    <span>{mes.mes}</span>
                    <span>R$ {mes.total}</span>
                  </div>

                  <div className="w-full bg-gray-200 rounded h-3">
                    <div
                      className="bg-blue-500 h-3 rounded"
                      style={{ width: `${largura}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* LOCAÇÕES RECENTES */}
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-lg font-semibold mb-4">Locações recentes</h2>

        {rentals.length === 0 ? (
          <p className="text-gray-500">Nenhuma locação encontrada.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2">Cliente</th>
                <th>Equipamento</th>
                <th>Status</th>
                <th>Data</th>
              </tr>
            </thead>

            <tbody>
              {rentals.map((rental) => (
                <tr key={rental.id} className="border-b">
                  <td className="py-2">
                    {rental.clients?.name || "—"}
                  </td>

                  <td>
                    {rental.equipment_assets?.name || "—"}
                  </td>

                  <td>{rental.status}</td>

                  <td>
                    {new Date(rental.start_date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}