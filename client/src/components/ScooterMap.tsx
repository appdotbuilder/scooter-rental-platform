
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Battery, MapPin, Unlock, QrCode } from 'lucide-react';
import type { Scooter } from '../../../server/src/schema';

interface ScooterMapProps {
  scooters: Scooter[];
  onStartRide: (scooterId: number) => void;
  hasActiveRide: boolean;
}

export function ScooterMap({ scooters, onStartRide, hasActiveRide }: ScooterMapProps) {
  const [selectedScooter, setSelectedScooter] = useState<Scooter | null>(null);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'text-green-600';
    if (level > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: Scooter['status']) => {
    const variants = {
      available: { variant: 'default', text: 'Disponível', color: 'bg-green-100 text-green-800' },
      in_use: { variant: 'secondary', text: 'Em uso', color: 'bg-blue-100 text-blue-800' },
      maintenance: { variant: 'destructive', text: 'Manutenção', color: 'bg-red-100 text-red-800' },
      charging: { variant: 'outline', text: 'Carregando', color: 'bg-yellow-100 text-yellow-800' }
    } as const;

    const config = variants[status];
    return (
      <Badge className={config.color}>
        {config.text}
      </Badge>
    );
  };

  const handleUnlockScooter = (scooter: Scooter) => {
    if (hasActiveRide) return;
    setSelectedScooter(scooter);
    setShowUnlockDialog(true);
  };

  const confirmUnlock = () => {
    if (selectedScooter) {
      onStartRide(selectedScooter.id);
      setShowUnlockDialog(false);
      setSelectedScooter(null);
    }
  };

  const availableScooters = scooters.filter(s => s.status === 'available');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Mapa de Patinetes 🗺️
          </CardTitle>
          <CardDescription>
            {availableScooters.length} patinetes disponíveis próximos a você
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Simulated map view for MVP demonstration */}
          <div className="bg-gradient-to-br from-blue-100 to-green-100 rounded-lg p-8 min-h-[400px] flex flex-col items-center justify-center">
            <div className="text-center mb-6">
              <MapPin className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Mapa Interativo (MVP)
              </h3>
              <p className="text-gray-600 text-sm">
                Integração com Google Maps/Mapbox será implementada na versão final
              </p>
            </div>
            
            {/* Sample map markers */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              {scooters.slice(0, 4).map((scooter: Scooter) => (
                <div
                  key={scooter.id}
                  className="bg-white rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => scooter.status === 'available' && handleUnlockScooter(scooter)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">#{scooter.serial_number}</span>
                    {getStatusBadge(scooter.status)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center">
                      <Battery className={`h-3 w-3 mr-1 ${getBatteryColor(scooter.battery_level)}`} />
                      {scooter.battery_level}%
                    </div>
                    <span>📍 {scooter.latitude.toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {hasActiveRide && (
        <Alert>
          <AlertDescription>
            ℹ️ Você já tem uma corrida ativa. Finalize-a antes de iniciar outra.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {scooters.map((scooter: Scooter) => (
          <Card key={scooter.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">#{scooter.serial_number}</CardTitle>
                {getStatusBadge(scooter.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <Battery className={`h-4 w-4 mr-2 ${getBatteryColor(scooter.battery_level)}`} />
                  <span>Bateria: {scooter.battery_level}%</span>
                </div>
                <span className={scooter.is_locked ? 'text-red-600' : 'text-green-600'}>
                  {scooter.is_locked ? '🔒' : '🔓'}
                </span>
              </div>
              
              <div className="text-xs text-gray-500">
                📍 {scooter.latitude.toFixed(4)}, {scooter.longitude.toFixed(4)}
              </div>
              
              <div className="text-xs text-gray-500">
                Último ping: {scooter.last_ping.toLocaleTimeString()}
              </div>

              {scooter.status === 'available' && !hasActiveRide && (
                <Button 
                  onClick={() => handleUnlockScooter(scooter)}
                  className="w-full"
                  size="sm"
                >
                  <Unlock className="h-4 w-4 mr-2" />
                  Desbloquear
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <QrCode className="h-5 w-5 mr-2" />
              Desbloquear Patinete
            </DialogTitle>
            <DialogDescription>
              Confirme o desbloqueio do patinete #{selectedScooter?.serial_number}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <QrCode className="h-16 w-16 mx-auto mb-3 text-gray-600" />
              <p className="text-sm text-gray-600">
                Na versão final, você escaneará o código QR do patinete
              </p>
            </div>
            
            {selectedScooter && (
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Patinete:</span>
                  <span className="font-medium">#{selectedScooter.serial_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bateria:</span>
                  <span className={getBatteryColor(selectedScooter.battery_level)}>
                    {selectedScooter.battery_level}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tarifa base:</span>
                  <span className="font-medium">R$ 3,00 + R$ 0,50/min</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnlockDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmUnlock}>
              Iniciar Corrida  🚀
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
