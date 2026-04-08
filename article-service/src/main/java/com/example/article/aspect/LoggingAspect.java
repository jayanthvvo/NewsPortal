package com.example.article.aspect;

import java.util.Arrays;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Aspect
@Component
@Slf4j
public class LoggingAspect {
	
	@Pointcut("execution(* com.example.article.controller.*.*(..))")
	public void contollerMethods() {}

	@Before("controllerMethods()")
	public void logbeforemethod(JoinPoint joinPoint) {
		String methodName = joinPoint.getSignature().getName();
        String className = joinPoint.getTarget().getClass().getSimpleName();
        Object[] args = joinPoint.getArgs();
        
        log.info("➡️ [ENTER] {}::{}() with arguments: {}", className, methodName, Arrays.toString(args));
		
	}
	@AfterReturning(pointcut = "controllerMethods()",returning = "result")
	public void logaftermethod(JoinPoint joinPoint,Object result) {
          String methodName = joinPoint.getSignature().getName();
        
        log.info("✅ [EXIT] {}() returned: {}", methodName, result != null ? result.toString() : "null");
	}
	@AfterThrowing(pointcut = "contollerMethods()",throwing = "exception")
	public void logifexception(JoinPoint joinPoint,Throwable exception) {
		String Methodname=joinPoint.getSignature().getName();
		log.error("❌ [ERROR] {}() crashed with exception: {}", Methodname, exception.getMessage());
	}
	
}
