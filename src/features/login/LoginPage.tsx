// src/features/login/LoginPage.tsx
import React from "react";
import { CustomButton } from "../../shared/ui/atomos/custom-button/CustomButton";
import { useAuth } from "../../context/AuthContext";
import styles from "./LoginPage.module.css";

export const LoginPage: React.FC = () => {
  const { login } = useAuth(); // Hook de autenticación

  return (
    <div className={styles.loginPage}>
      <section className={styles.brandHero}>
        <div className={styles.brandContent}>
          <h1>Pedidos</h1>
          <h1>360</h1>
        </div>
      </section>

      <section className={styles.loginSection}>
        <div className={styles.loginCard}>
          <h2>Iniciar Sesión</h2>
          <p className={styles.loginSubtitle}>
            Inicia sesión mediante AWS para continuar
          </p>

          <CustomButton
            variant="primary"
            size="lg"
            fullWidth
            onClick={login} // Llama al redireccionamiento de Cognito
          >
            Acceder
          </CustomButton>

          <div className={styles.securityNotice}>
            <span>Acceso restringido solo para cuentas de AWS.</span>
          </div>
        </div>
      </section>
    </div>
  );
};
