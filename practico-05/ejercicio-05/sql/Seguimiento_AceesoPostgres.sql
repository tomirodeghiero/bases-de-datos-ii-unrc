
DROP TABLE IF EXISTS seguimiento_acceso;
CREATE TABLE  seguimiento_acceso (
  SEGUIMIENTO_ACCESO_ID serial NOT NULL ,
  FECHA_YHORA_ENTRADA timestamp  default NULL,
  FECHA_YHORA_SALIDA timestamp  default NULL,
  HOST varchar(100)  default NULL,
  PERSONA_ID bigint default NULL references persona,
  RECURSO_ID bigint default NULL references recurso,
  PRIMARY KEY  (SEGUIMIENTO_ACCESO_ID) 
) ;
