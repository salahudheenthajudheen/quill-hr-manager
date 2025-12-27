/**
 * Employee Sign In Component
 * Login page for employees to access their portal
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Eye, EyeOff, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const EmployeeSignIn = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const { loginEmployee } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim() || !password.trim()) {
            setError('Please enter both email and password');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await loginEmployee(email, password);

            toast({
                title: 'Login Successful',
                description: 'Welcome back!',
            });

            navigate('/employee/dashboard');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-secondary/50 flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-6">
                {/* Header */}
                <div className="text-center animate-fade-in">
                    <div className="flex items-center justify-center mb-6">
                        <div className="p-4 rounded-2xl gradient-hero shadow-glow">
                            <Users className="h-12 w-12 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                        Employee Portal
                    </h1>
                    <p className="text-muted-foreground">
                        HR Management System - Employee Access
                    </p>
                </div>

                {/* Login Card */}
                <Card className="animate-slide-up shadow-xl border-0">
                    <CardHeader className="space-y-1">
                        <CardTitle className="flex items-center text-2xl">
                            <LogIn className="h-6 w-6 mr-2 text-primary" />
                            Sign In
                        </CardTitle>
                        <CardDescription>
                            Enter your credentials to access your dashboard
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    className="h-11"
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className="h-11 pr-10"
                                        disabled={loading}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading || !email.trim() || !password.trim()}
                                className="w-full h-11 gradient-primary text-white font-medium"
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </Button>

                            {/* Error Message */}
                            {error && (
                                <Alert className="animate-slide-up border-destructive">
                                    <AlertDescription className="text-destructive">
                                        {error}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center text-sm text-muted-foreground space-y-2">
                    <p>Secure employee access • Protected by enterprise security</p>
                    <Button
                        variant="link"
                        className="text-primary"
                        onClick={() => navigate('/admin/login')}
                    >
                        Admin Login →
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default EmployeeSignIn;
