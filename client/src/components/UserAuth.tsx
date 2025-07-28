
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { User, CreateUserInput, LoginInput } from '../../../server/src/schema';

interface UserAuthProps {
  onLogin: (user: User) => void;
}

export function UserAuth({ onLogin }: UserAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [loginData, setLoginData] = useState<LoginInput>({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState<CreateUserInput>({
    email: '',
    password: '',
    full_name: '',
    phone: null
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Since login handler is stub, simulate successful login
      const demoUser: User = {
        id: 1,
        email: loginData.email,
        password_hash: 'hashed',
        full_name: 'Usuário Demo',
        phone: null,
        is_admin: loginData.email.includes('admin'),
        created_at: new Date(),
        updated_at: new Date()
      };
      
      onLogin(demoUser);
    } catch (error) {
      console.error('Login failed:', error);
      setError('Email ou senha incorretos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const user = await trpc.createUser.mutate(registerData);
      onLogin(user);
    } catch (error) {
      console.error('Registration failed:', error);
      setError('Falha ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle>Bem-vindo! 🛴</CardTitle>
        <CardDescription>
          Entre na sua conta ou crie uma nova para começar a andar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="register">Criar Conta</TabsTrigger>
          </TabsList>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={loginData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLoginData((prev: LoginInput) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Sua senha"
                  value={loginData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLoginData((prev: LoginInput) => ({ ...prev, password: e.target.value }))
                  }
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
              <p className="text-xs text-center text-gray-500 mt-2">
                💡 Dica: use admin@teste.com para acessar o painel administrativo
              </p>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Input
                  placeholder="Seu nome completo"
                  value={registerData.full_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRegisterData((prev: CreateUserInput) => ({ ...prev, full_name: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={registerData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRegisterData((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Input
                  placeholder="Telefone (opcional)"
                  value={registerData.phone || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRegisterData((prev: CreateUserInput) => ({
                      ...prev,
                      phone: e.target.value || null
                    }))
                  }
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Crie uma senha (min. 6 caracteres)"
                  value={registerData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRegisterData((prev: CreateUserInput) => ({ ...prev, password: e.target.value }))
                  }
                  minLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Criando conta...' : 'Criar Conta'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
