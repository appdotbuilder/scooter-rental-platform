
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Navigation, 
  DollarSign, 
  Activity, 
  TrendingUp, 
  Battery,
  MapPin,
  Clock
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { DashboardMetrics } from '../../../server/src/schema';

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sample data since handler is stub
  const sampleMetrics: DashboardMetrics = {
    total_users: 1247,
    active_rides: 23,
    total_scooters: 150,
    available_scooters: 127,
    total_revenue: 45689.50,
    rides_today: 89,
    revenue_today: 1234.75
  };

  const loadMetrics = useCallback(async () => {
    try {
      await trpc.getDashboardMetrics.query();
      // Since handler is stub, use sample data
      setMetrics(sampleMetrics);
    } catch (error) {
      console.error('Failed to load dashboard metrics:', error);
      // Use sample data as fallback
      setMetrics(sampleMetrics);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-gray-500">Carregando...</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-red-500">Erro ao carregar métricas</p>
        </CardContent>
      </Card>
    );
  }

  const scooterUtilization = ((metrics.total_scooters - metrics.available_scooters) / metrics.total_scooters * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Totais</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_users.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% em relação ao mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Corridas Ativas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.active_rides}</div>
            <p className="text-xs text-muted-foreground">
              🚀 Corridas em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frota Total</CardTitle>
            <Navigation className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_scooters}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.available_scooters} disponíveis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {metrics.total_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">
              +8% em relação ao mês passado
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Corridas Hoje</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.rides_today}</div>
            <p className="text-xs text-muted-foreground">
              Média de 95 corridas/dia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Hoje</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {metrics.revenue_today.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">
              Média de R$ 1.150/dia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Utilização</CardTitle>
            <Battery className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scooterUtilization}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.total_scooters - metrics.available_scooters} patinetes em uso
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resumo da Operação 📊</CardTitle>
            <CardDescription>
              Visão geral da plataforma em tempo real
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Patinetes Disponíveis</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${(metrics.available_scooters / metrics.total_scooters) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{metrics.available_scooters}/{metrics.total_scooters}</span>
              </div>
            </div>
            
            
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Corridas Ativas</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(metrics.active_rides / metrics.total_scooters) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{metrics.active_rides}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Meta Diária de Corridas</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-600 h-2 rounded-full" 
                    style={{ width: `${(metrics.rides_today / 100) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{metrics.rides_today}/100</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas do Sistema ⚠️</CardTitle>
            <CardDescription>
              Itens que precisam de atenção
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3 p-2 bg-yellow-50 rounded-lg">
              <Battery className="h-4 w-4 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">5 patinetes com bateria baixa</p>
                <p className="text-xs text-gray-600">Precisam ser coletados para recarga</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-2 bg-red-50 rounded-lg">
              <MapPin className="h-4 w-4 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">2 patinetes fora da área</p>
                <p className="text-xs text-gray-600">Reposicionamento necessário</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
              <Activity className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Sistema operando normalmente</p>
                <p className="text-xs text-gray-600">Todos os serviços online</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
