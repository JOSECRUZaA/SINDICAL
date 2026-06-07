import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const profileLoadedRef = useRef(false);

    useEffect(() => {
        // Obtener la sesión inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Escuchar cambios de estado de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                // Solo cargar perfil si es una nueva sesión o no se ha cargado
                if (!profileLoadedRef.current || profile?.auth_user_id !== session.user.id) {
                    fetchProfile(session.user.id);
                }
            } else {
                setProfile(null);
                profileLoadedRef.current = false;
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId) => {
        try {
            // Reintentos en caso de que el trigger de Supabase demore unos milisegundos
            let data = null;
            let error = null;
            for (let i = 0; i < 3; i++) {
                const res = await supabase
                    .from('perfiles')
                    .select('*')
                    .eq('auth_user_id', userId)
                    .single();
                
                data = res.data;
                error = res.error;
                
                if (data) break;
                // Esperar 500ms antes de reintentar si no se encontró
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error);
            } else if (data) {
                setProfile(data);
                profileLoadedRef.current = true;
            }
        } catch (err) {
            console.error('Exception fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    };

    const register = async (email, password, nombres, ci) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    nombres: nombres,
                    ci: ci
                }
            }
        });
        if (error) throw error;
        return data;
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
