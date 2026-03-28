package jsonPath;

import java.io.File;
import java.io.IOException;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.jayway.jsonpath.JsonPath;

public class Ejercicio1Inventario {

    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();

    private static void ejecutarConsulta(File jsonFile, String titulo, String expresion) throws IOException {
        Object resultado = JsonPath.read(jsonFile, expresion);
        System.out.println("==== " + titulo + " ====");
        System.out.println("JsonPath: " + expresion);
        System.out.println(GSON.toJson(resultado));
        System.out.println();
    }

    public static void main(String[] args) {
        String jsonPath = "./jsonInventario.txt";
        File jsonFile = new File(jsonPath);

        try {
            // a) Todos los items del inventario.
            ejecutarConsulta(jsonFile, "a) Todos los items del inventario", "$.inventario.items[*]");

            // b) Nombres de todos items del inventario.
            ejecutarConsulta(jsonFile, "b) Nombres de todos los items", "$.inventario.items[*].nombre");

            // c) Item que estan bajos en stock (cantidad < stock_min).
            ejecutarConsulta(jsonFile, "c) Items bajos en stock",
                    "$.inventario.items[?(@.cantidad < $['stock_min'])]");

            // d) Colores de los items cuyo alto es mas de 10 cm.
            ejecutarConsulta(jsonFile, "d) Colores de items con alto > 10 cm",
                    "$.inventario.items[?(@.tamanio.unidad == 'cm' && @.tamanio.alto > 10)].colores[*]");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
