package com.example.auth.exception;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex){
		Map<String, String> errors=new HashMap<String, String>();
		
		ex.getBindingResult().getAllErrors().forEach((e)->{
			String fieldname=((FieldError) e).getField();
			String Errormessage=e.getDefaultMessage();
			errors.put(fieldname, Errormessage);
		});
		
		return new ResponseEntity<>(errors,HttpStatus.BAD_REQUEST);

	} 
	@ExceptionHandler(RuntimeException.class)
	public ResponseEntity<String> handleruntimeexception(RuntimeException ex){
     return new  ResponseEntity<>(ex.getMessage(),HttpStatus.BAD_REQUEST);

	}
}


