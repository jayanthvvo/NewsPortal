package com.example.article.aspect;

import java.util.Arrays;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class LoggingAspect {
	
	private static final Logger log = LoggerFactory.getLogger(LoggingAspect.class);
	
	@Pointcut("execution(* com.example.article.controller.*.*(..))")
	public void controllerMethods() {}

	@Before("controllerMethods()")
	public void logbeforemethod(JoinPoint joinPoint) {
		String methodName = joinPoint.getSignature().getName();
        String className = joinPoint.getTarget().getClass().getSimpleName();
        Object[] args = joinPoint.getArgs();
        
        log.info("➡️ [ENTER] {}::{}() with arguments: {}", className, methodName, Arrays.toString(args));
	}
	
	@AfterReturning(pointcut = "controllerMethods()", returning = "result")
	public void logaftermethod(JoinPoint joinPoint, Object result) {
        String methodName = joinPoint.getSignature().getName();
        
        log.info("✅ [EXIT] {}() returned: {}", methodName, result != null ? result.toString() : "null");
	}
	
	@AfterThrowing(pointcut = "controllerMethods()", throwing = "exception")
	public void logifexception(JoinPoint joinPoint, Throwable exception) {
		String methodName = joinPoint.getSignature().getName();
		log.error("❌ [ERROR] {}() crashed with exception: {}", methodName, exception.getMessage());
	}
}
