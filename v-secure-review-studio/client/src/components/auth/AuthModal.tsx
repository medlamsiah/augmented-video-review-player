import { useState } from "react";
import type { FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogIn, Mail, UserPlus, X } from "lucide-react";
import { login, logout, register, saveAuthSession } from "../../lib/auth";
import { Button } from "../ui/Button";

export type AuthUser = {
  name: string;
  role: string;
  accent: string;
  email?: string;
};

type AuthMode = "login" | "signup";

type AuthModalProps = {
  user: AuthUser;
  onAuthenticated: (user: AuthUser) => void;
  onLogout: () => void;
};

export function AuthModal({ user, onAuthenticated, onLogout }: AuthModalProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signup");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(user.email ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response =
        mode === "signup"
          ? await register({
              firstName,
              lastName,
              email,
              password
            })
          : await login({ email, password });

      saveAuthSession(response);
      onAuthenticated(response.user);
      setOpen(false);
      setPassword("");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "auth_failed";
      setError(message === "email_already_registered" ? "Cet email est deja inscrit." : "Identifiants invalides ou serveur indisponible.");
    } finally {
      setLoading(false);
    }
  }

  async function disconnect() {
    await logout();
    onLogout();
    setOpen(false);
  }

  return (
    <>
      <Button variant={user.email ? "secondary" : "primary"} icon={user.email ? <Mail size={16} /> : <UserPlus size={16} />} onClick={() => setOpen(true)}>
        {user.email ? user.name : "S'inscrire"}
      </Button>

      <AnimatePresence>
        {open ? (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="auth-modal" initial={{ opacity: 0, y: 18, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 14, scale: 0.98 }}>
              <div className="auth-visual">
                <div className="auth-shield">
                  <UserPlus size={28} />
                </div>
                <span>Secure identity</span>
                <strong>Collaboration nominative</strong>
                <p>Connectez un profil demo pour signer les annotations, commentaires et exports avec un vrai nom.</p>
              </div>

              <form className="auth-form" onSubmit={submit}>
                <div className="auth-header">
                  <div>
                    <span>V-Secure Access</span>
                    <strong>{mode === "signup" ? "Creer un compte" : "Connexion"}</strong>
                  </div>
                  <Button variant="ghost" icon={<X size={16} />} onClick={() => setOpen(false)} type="button" aria-label="Fermer" />
                </div>

                <div className="auth-tabs">
                  <button type="button" className={mode === "signup" ? "is-active" : ""} onClick={() => setMode("signup")}>
                    Inscription
                  </button>
                  <button type="button" className={mode === "login" ? "is-active" : ""} onClick={() => setMode("login")}>
                    Login
                  </button>
                </div>

                {mode === "signup" ? (
                  <div className="auth-grid">
                    <label>
                      Nom
                      <input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Laurent" required />
                    </label>
                    <label>
                      Prenom
                      <input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Maya" required />
                    </label>
                  </div>
                ) : null}

                <label>
                  Email
                  <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="maya@v-secure.local" required />
                </label>

                <label>
                  Password
                  <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="********" minLength={4} required />
                </label>

                {error ? <div className="auth-error">{error}</div> : null}

                <Button variant="primary" icon={mode === "signup" ? <UserPlus size={16} /> : <LogIn size={16} />} type="submit" disabled={loading}>
                  {mode === "signup" ? "S'inscrire" : "Se connecter"}
                </Button>
                {user.email ? (
                  <Button variant="ghost" type="button" onClick={disconnect}>
                    Se deconnecter
                  </Button>
                ) : null}
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
