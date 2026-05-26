// Login.js

import React from "react";

import { Formik } from "formik";

import { useNavigate } from "react-router-dom";

import axios from "axios";

const Login = ({ onLogin }) => {

  const navigate = useNavigate();

  return (

    <div style={styles.container}>

      <Formik

        initialValues={{
          usuario: "",
          password: ""
        }}

        validate={(values) => {

          const errors = {};

          if (!values.usuario) {
            errors.usuario =
              "El usuario es obligatorio";
          }

          if (!values.password) {
            errors.password =
              "La contraseña es obligatoria";
          }

          return errors;
        }}

        onSubmit={async (
          values,
          {
            setSubmitting,
            setErrors
          }
        ) => {

          try {

            // LOGIN BACKEND
            const response =
              await axios.post(
                "http://localhost:8080/api/login",
                {
                  usuario: values.usuario,
                  password: values.password
                }
              );

            const data = response.data;
              console.log(data.error)
            // GUARDA TOKEN
            localStorage.setItem(
              "token",
              data.token
            );

            // GUARDA USUARIO
            localStorage.setItem(
              "usuario",
             // data.usuario.usuario
             JSON.stringify(data.usuario)
            );

            // FECHA LOGIN
            localStorage.setItem(
              "loginTime",
              Date.now()
            );

            // ACTUALIZA AUTH
            onLogin();

            // REDIRECCIONA
            navigate("/");

          } catch (error) {
            
            setErrors({
              password:
                "Usuario y/o Contraseña incorrectos",
            });

          }

          setSubmitting(false);
        }}

      >

        {({

          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit,
          isSubmitting

        }) => (

          <form
            onSubmit={handleSubmit}
            style={styles.form}
          >

            {/* USUARIO */}
            <label>Usuario</label>

            <input
              type="text"
              name="usuario"
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.usuario}
              style={styles.input}
            />

            {
              errors.usuario &&
              touched.usuario && (

                <div style={styles.error}>
                  {errors.usuario}
                </div>
              )
            }

            {/* PASSWORD */}
            <label>Contraseña</label>

            <input
              type="password"
              name="password"
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.password}
              style={styles.input}
            />

            {
              errors.password &&
              touched.password && (

                <div style={styles.error}>
                  {errors.password}
                </div>
              )
            }

            {/* BOTON */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={styles.button}
            >

              Ingresar

            </button>

          </form>
        )}

      </Formik>

    </div>
  );
};

const styles = {

  container: {
    maxWidth: "300px",
    margin: "50px auto",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    textAlign: "center"
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },

  input: {
    padding: "8px"
  },

  button: {
    padding: "10px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    cursor: "pointer"
  },

  error: {
    color: "red",
    fontSize: "12px"
  }

};

export default Login;