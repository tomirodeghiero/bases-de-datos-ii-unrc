--
-- PostgreSQL database dump
--

-- Started on 2014-10-04 11:15:54 

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = off;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET escape_string_warning = off;


SET default_tablespace = '';

SET default_with_oids = false;

--
-- TOC entry 1728 (class 1259 OID 24470)
-- Dependencies: 2007 2008 2009 9
-- Name: recurso; Type: TABLE; Schema: ; Owner: postgres; Tablespace: 
--
DROP TABLE IF EXISTS recurso;
CREATE TABLE recurso (
    "RECURSO_ID" bigint DEFAULT 0::bigint NOT NULL,
    "DESCRIPCION" character varying(255) DEFAULT NULL::character varying,
    "ID" bigint,
    "NOMBRE" character varying(255) DEFAULT NULL::character varying,
    "ORDEN" bigint
);


ALTER TABLE recurso OWNER TO postgres;

--
-- TOC entry 2012 (class 0 OID 24470)
-- Dependencies: 1728
-- Data for Name: recurso; Type: TABLE DATA; Schema: procedimiento; Owner: postgres
--

INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355328, 'Chat', 131095, 'Chat', 90);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355329, 'Aula Virtual', 131096, 'Inicio', 91);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355330, 'Preguntas Frecuentes', 131097, 'Faq', 3);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355331, 'Pizarrón', 131098, 'Pizarrón', 2);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355332, 'Correo', 131100, 'Correo', 92);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355333, 'ForoOpinion', 131101, 'ForoOpinion', 14);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355334, 'Foro', 131102, 'ForoAsunto', 15);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355335, NULL, 131103, 'ForoEstado', 16);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355336, 'Estadisticas', 131104, 'Estadisticas', 12);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355337, 'EstadisticasAcceso', 131105, 'EstadisticasAcceso', 93);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355338, 'Actividades', 131106, 'Actividades', 7);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355339, 'Actividades', 131107, 'EnviarActividadesYVerCalificaciones', 8);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355340, 'Actividades', 131108, 'RecibirYEvaluarActividades', 9);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355341, 'Actividades', 131109, 'EvaluarActividades', 10);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355342, 'Actividades', 131110, 'CrearActividades', 11);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355343, NULL, 131111, 'EncuestasLLenar', 94);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355344, NULL, 131112, 'EncuestasHabilitar', 95);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355345, NULL, 131113, 'EncuestasResultados', 96);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355346, 'CarpetaPersonal', 131114, 'CarpetaPersonal', 97);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355347, 'Materiales', 131115, 'Materiales', 5);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355348, 'Bibliografia', 131117, 'Bibliografia', 98);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355349, 'Sofware', 131118, 'Sofware', 99);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355350, 'MaterialesAdicionales', 131116, 'MaterialesAdicionales', 100);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355351, 'Enlaces', 131119, 'Enlaces', 101);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355352, 'Noticias', 131120, 'Noticias', 1);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355353, 'EvaluarArchivo', 131121, 'EvaluarArchivo', 102);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355354, 'Secretaria', 131122, 'Secretaria', 103);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355355, 'DatosPersonales', 131123, 'DatosPersonales', 104);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355356, 'InformacionCarrera', 131124, 'InformacionCarrera', 13);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355357, 'Calendario', 131125, 'Calendario', 4);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355358, 'Alertas', 131126, 'Alertas', 105);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355359, 'Oferta', 131127, 'Oferta', 106);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355360, 'Contactos', 131128, 'Contactos', 6);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355361, 'Seguimiento', 131129, 'Seguimiento', 107);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488355362, 'Localidades', 131130, 'Localidades', 108);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488388096, 'CalificacionesVistaAlumno', 244924390, 'CalificacionesVistaAlumno', 109);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488388097, 'CalificacionesVistaTutor', 244924392, 'CalificacionesVistaTutor', 110);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488420864, 'Administracion', 740988508, 'Administracion', 111);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488420865, 'Respuestas Frecuentes FAQGPC', 740988510, 'Respuestas Frecuentes FAQGPC', 112);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488420866, 'Preguntas Frecuentes FAQGPC', 740988512, 'Preguntas Frecuentes FAQGPC', 113);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488486400, 'FaqGPC', 2788294831, 'FaqGPC', 114);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488486401, 'GestionIntegrantes', 2788294826, 'GestionIntegrantes', 115);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488486402, 'Invitacion', 2788294827, 'Invitacion', 116);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488486403, 'Solicitud', 2788294828, 'Solicitud', 117);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488486404, 'Grupo', 2788294829, 'Grupo', 118);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488486405, 'Anotador', 2788294830, 'Anotador', 119);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488519168, 'SecretariaGrupo', 2809462785, 'SecretariaGrupo', 120);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488551936, 'ConfiguracionDeGrupos', 3030581249, 'ConfiguracionDeGrupos', NULL);
INSERT INTO recurso ("RECURSO_ID", "DESCRIPCION", "ID", "NOMBRE", "ORDEN") VALUES (140737488551937, 'AdministracionDeGrupos', 3030581251, 'AdministracionDeGrupos', NULL);


--
-- TOC entry 2011 (class 2606 OID 24480)
-- Dependencies: 1728 1728
-- Name: recurso_pkey; Type: CONSTRAINT; Schema: procedimiento; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY recurso
    ADD CONSTRAINT recurso_pkey PRIMARY KEY ("RECURSO_ID");


-- Completed on 2014-10-04 11:15:54

--
-- PostgreSQL database dump complete
--

