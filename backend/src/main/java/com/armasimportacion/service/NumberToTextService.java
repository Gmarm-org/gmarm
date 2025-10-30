package com.armasimportacion.service;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Servicio para convertir números a texto en español
 * Usado en la generación de contratos para mostrar cantidades en letras
 */
@Service
public class NumberToTextService {

    private static final String[] UNIDADES = {
        "", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"
    };

    private static final String[] DECENAS = {
        "", "", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"
    };

    private static final String[] CENTENAS = {
        "", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", 
        "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"
    };

    private static final String[] MILES = {
        "", "MIL", "MILLÓN", "MILLONES"
    };

    /**
     * Convierte un número decimal a texto en español
     * @param numero El número a convertir
     * @return El número escrito en texto
     */
    public String convertToText(BigDecimal numero) {
        if (numero == null) {
            return "CERO";
        }

        // Redondear a 2 decimales y obtener la parte entera
        BigDecimal redondeado = numero.setScale(2, RoundingMode.HALF_UP);
        int parteEntera = redondeado.intValue();
        int centavos = redondeado.subtract(new BigDecimal(parteEntera))
                                .multiply(new BigDecimal(100))
                                .intValue();

        String resultado = convertirNumero(parteEntera);
        
        // Formatear centavos con 2 dígitos (ej: 67, 05, 00)
        String centavosStr = String.format("%02d", centavos);
        resultado += " con " + centavosStr + "/100";

        // Asegurar que TODO esté en mayúsculas (por si acaso hay algún caso especial)
        return resultado.toUpperCase();
    }

    /**
     * Convierte un número entero a texto
     */
    private String convertirNumero(int numero) {
        if (numero == 0) {
            return "CERO";
        }

        if (numero < 0) {
            return "MENOS " + convertirNumero(-numero);
        }

        String resultado = "";

        // Miles
        if (numero >= 1000) {
            int miles = numero / 1000;
            if (miles == 1) {
                resultado = "MIL";
            } else {
                resultado = convertirNumero(miles) + " MIL";
            }
            numero %= 1000;
        }

        // Centenas
        if (numero >= 100) {
            int centenas = numero / 100;
            if (centenas == 1 && numero % 100 == 0) {
                resultado += (resultado.isEmpty() ? "" : " ") + "CIEN";
            } else {
                resultado += (resultado.isEmpty() ? "" : " ") + CENTENAS[centenas];
            }
            numero %= 100;
        }

        // Decenas y unidades
        if (numero >= 20) {
            int decenas = numero / 10;
            int unidades = numero % 10;
            
            if (decenas == 2 && unidades == 0) {
                resultado += (resultado.isEmpty() ? "" : " ") + "VEINTE";
            } else if (decenas == 2) {
                resultado += (resultado.isEmpty() ? "" : " ") + "VEINTI" + UNIDADES[unidades];
            } else {
                resultado += (resultado.isEmpty() ? "" : " ") + DECENAS[decenas];
                if (unidades > 0) {
                    resultado += " Y " + UNIDADES[unidades];
                }
            }
        } else if (numero >= 10) {
            // Números especiales del 10 al 19
            String[] especiales = {
                "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", 
                "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"
            };
            resultado += (resultado.isEmpty() ? "" : " ") + especiales[numero - 10];
        } else if (numero > 0) {
            resultado += (resultado.isEmpty() ? "" : " ") + UNIDADES[numero];
        }

        return resultado.trim();
    }

    /**
     * Método de conveniencia para números enteros
     */
    public String convertToText(int numero) {
        return convertirNumero(numero);
    }

    /**
     * Método de conveniencia para doubles
     */
    public String convertToText(double numero) {
        return convertToText(BigDecimal.valueOf(numero));
    }
}
