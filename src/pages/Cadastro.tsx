import React, { useState, startTransition, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import { sanitizeText, validatePassword } from "../security/sanitize";
import { useRBAC } from "../hooks/useRBAC";
import { logAuditEvent } from "../security/auditLogger";

export default function Cadastro() {
    const { isAdmin, loading: rbacLoading, profile } = useRBAC();
    const navigate = useNavigate();

    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [role, setRole] = useState("user");
    const [mensagem, setMensagem] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // RESTRICT ACCESS: Registration is for Admins only
    useEffect(() => {
        if (!rbacLoading && !isAdmin) {
            navigate("/login");
        }
    }, [isAdmin, rbacLoading, navigate]);

    if (rbacLoading) return null;

    const handleCadastro = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // 1. Sanitize & Validate
        const cleanNome = sanitizeText(nome);
        const cleanEmail = email.trim().toLowerCase();
        
        const pwdCheck = validatePassword(senha);
        if (!pwdCheck.valid) {
            setMensagem(pwdCheck.message);
            return;
        }

        setIsSubmitting(true);
        setMensagem("");

        try {
            // Register user in Supabase Auth
            const { data, error } = await supabase.auth.signUp({
                email: cleanEmail,
                password: senha,
                options: {
                    data: { 
                        nome: cleanNome,
                        role: role // The trigger public.handle_new_user() will handle this
                    },
                },
            });

            if (error) {
                let errorMessage = "Erro ao cadastrar usuário.";
                if (error.message.toLowerCase().includes("user already registered")) {
                    errorMessage = "Este e-mail já está em uso.";
                }
                setMensagem(errorMessage);
                setIsSubmitting(false);
            } else {
                if (data.user) {
                    // Update user profile role (if trigger didn't catch it or for extra safety)
                    await supabase
                        .from('profiles')
                        .update({ role: role, company_id: profile?.company_id })
                        .eq('id', data.user.id);

                    await logAuditEvent({
                        action: 'record_created',
                        company_id: profile?.company_id,
                        resource: 'profiles',
                        resource_id: data.user.id,
                        metadata: { email: cleanEmail, role },
                        severity: 'info'
                    });
                }

                setMensagem("Novo colaborador cadastrado com sucesso!");
                setTimeout(() => {
                    startTransition(() => {
                        navigate("/usuarios");
                    });
                }, 2000);
            }
        } catch (err) {
            setMensagem("Ocorreu um erro inesperado.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-background-light dark:bg-background-dark p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center p-3 bg-green-500/10 rounded-xl mb-4">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Adicionar Colaborador</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Cadastre um novo membro para sua equipe</p>
                    </div>

                    <form onSubmit={handleCadastro} className="space-y-5">
                        {mensagem && (
                            <div className={`p-3 rounded-lg text-sm border text-center animate-in slide-in-from-top-2 duration-300 ${!mensagem.includes('sucesso') ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/10 dark:border-red-500/20' : 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/10 dark:border-green-500/20'}`}>
                                {mensagem}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                            <input
                                type="text"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-slate-100 transition-colors"
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail Corporativo</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-slate-100 transition-colors"
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Perfil de Acesso</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-slate-100"
                                disabled={isSubmitting}
                            >
                                <option value="user">Usuário Padrão</option>
                                <option value="manager">Gerente de Operações</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha Provisória</label>
                            <input
                                type="password"
                                autoComplete="new-password"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-slate-100 transition-colors"
                                required
                                disabled={isSubmitting}
                            />
                            <p className="mt-1 text-[10px] text-slate-400">Min. 8 caracteres, letras e números.</p>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full bg-slate-900 dark:bg-primary hover:bg-slate-800 dark:hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-lg transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isSubmitting ? 'Processando Cadastro...' : 'Cadastrar Colaborador'}
                        </button>
                    </form>
                </div>

                <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-center">
                    <button 
                        onClick={() => navigate('/usuarios')}
                        className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
                    >
                        ← Voltar para listagem
                    </button>
                </div>
            </div>
        </div>
    );
}