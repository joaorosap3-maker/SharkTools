import React, { useState, startTransition } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";
import { sanitizeText } from "../security/sanitize";
import { checkRateLimit, recordFailedAttempt, clearRateLimit } from "../security/rateLimiter";
import { logFailedLogin } from "../security/auditLogger";

export default function Login() {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [fullName, setFullName] = useState("");
    const [mensagem, setMensagem] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    // Auto-redirect if already logged in
    React.useEffect(() => {
        if (user) {
            navigate("/dashboard", { replace: true });
        }
    }, [user, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (mode === "register") {
            await handleRegister();
            return;
        }
        
        // 1. Sanitize
        const cleanEmail = sanitizeText(email).toLowerCase();
        const cleanSenha = senha; // Passwords shouldn't be HTML-sanitized but kept raw for bcrypt
        
        // 2. Client-side Rate Limit
        const rateLimit = checkRateLimit(cleanEmail);
        if (!rateLimit.allowed) {
            setMensagem(`Muitas tentativas. Aguarde ${rateLimit.retryAfterSeconds} segundos.`);
            return;
        }

        setIsLoading(true);
        setMensagem("");

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password: cleanSenha,
            });

            if (error) {
                // Record failure for rate limiting
                recordFailedAttempt(cleanEmail);
                
                // Log failed attempt to DB (Audit Log)
                await logFailedLogin(cleanEmail);

                // Generic error message to prevent account enumeration
                if (error.status === 400 || error.message.includes("Invalid login")) {
                    setMensagem("E-mail ou senha incorretos.");
                } else {
                    setMensagem("Ocorreu um erro ao processar seu login. Tente novamente mais tarde.");
                }
            } else {
                // Success
                clearRateLimit(cleanEmail);
                startTransition(() => {
                    navigate("/");
                });
            }
        } catch (err) {
            setMensagem("Erro de conexão. Verifique sua internet.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async () => {
        setIsLoading(true);
        setMensagem("");

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password: senha,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (error) {
                console.error("Erro cadastro:", error.message);
                setMensagem("Erro ao criar conta: " + error.message);
                return;
            }

            alert("Conta criada com sucesso. Faça login.");
            setFullName("");
            setEmail("");
            setSenha("");
            setMode("login");
        } catch (err) {
            setMensagem("Erro de conexão. Verifique sua internet.");
        } finally {
            setIsLoading(false);
        }
    };

    const switchMode = () => {
        setMensagem("");
        setMode((prev) => (prev === "login" ? "register" : "login"));
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-background-light dark:bg-background-dark p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-xl mb-4">
                            <span className="text-2xl font-bold text-primary">ST</span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">SharkTools</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">A força da sua obra — Entre com segurança</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {mensagem && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-500/20 text-center animate-in fade-in duration-300">
                                {mensagem}
                            </div>
                        )}

                        {mode === "register" && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome completo</label>
                                <input
                                    type="text"
                                    autoComplete="name"
                                    placeholder="Seu nome completo"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
                            <input
                                type="email"
                                autoComplete="username"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha</label>
                            <input
                                type="password"
                                autoComplete={mode === "register" ? "new-password" : "current-password"}
                                placeholder="••••••••"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {mode === "register" ? "Criando conta..." : "Autenticando..."}
                                </span>
                            ) : mode === "register" ? "Criar conta" : "Acessar Sistema"}
                        </button>

                        <div className="mt-4 text-center">
                            <button
                                type="button"
                                onClick={() => setMode(mode === "login" ? "register" : "login")}
                                className="text-sm text-blue-600 hover:underline focus:outline-none"
                                disabled={isLoading}
                            >
                                {mode === "login"
                                    ? "Não possui conta? Criar conta"
                                    : "Já possui conta? Fazer login"}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-center">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Acesso restrito a colaboradores autorizados.
                    </p>
                </div>
            </div>
            
            <p className="mt-8 text-xs text-slate-400 dark:text-slate-600 uppercase tracking-widest font-medium">
                SharkTools SaaS Security Protected
            </p>
        </div>
    );
}