package jsonPath;

import java.io.File;
import java.io.IOException;

import com.jayway.jsonpath.*;
//import com.jayway.jsonpath.internal.filter.ValueNode.JsonNode;

public class pruebaJson {

	public static void main(String[] args) {
		// TODO Auto-generated method stub
		 String jsonString = "./json.txt";
		
		
		 File jsonFile = new File(jsonString);
		 		
//		 String jsonExp = "$.store..[?(@.price > 20)]";
		 String jsonExp = "$.store.book.[?(@.price > 20)]";
		 
		 try {
			System.out.println(""+ JsonPath.read(jsonFile,jsonExp));
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}		 
		 
		
	}

}
