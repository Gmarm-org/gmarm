-- V12: Agregar campos para firma electrónica en licencia
ALTER TABLE licencia ADD COLUMN certificado_p12 BYTEA;
ALTER TABLE licencia ADD COLUMN certificado_password_cifrado VARCHAR(512);
ALTER TABLE licencia ADD COLUMN certificado_huella VARCHAR(128);
ALTER TABLE licencia ADD COLUMN firma_habilitada BOOLEAN DEFAULT false;
