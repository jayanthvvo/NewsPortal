package com.category.aspect;

import java.util.Arrays;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;

@Aspect
@Component
@Slf4j
public class LoggingAspect {
	
	@Pointcut("execution(* com.category.controller.*.*(..))")
	public void controllerMethods() {}

	@Before("controllerMethods()")
	public void logBeforeMethod(JoinPoint joinPoint) {
		String methodName = joinPoint.getSignature().getName();
        String className = joinPoint.getTarget().getClass().getSimpleName();
        Object[] args = joinPoint.getArgs();
        log.info("➡️ [ENTER] {}::{}() with arguments: {}", className, methodName, Arrays.toString(args));
	}
	
	@AfterReturning(pointcut = "controllerMethods()", returning = "result")
	public void logAfterMethod(JoinPoint joinPoint, Object result) {
        String methodName = joinPoint.getSignature().getName();
        log.info("✅ [EXIT] {}() returned: {}", methodName, result != null ? result.toString() : "null");
	}
	
	@AfterThrowing(pointcut = "controllerMethods()", throwing = "exception")
	public void logIfException(JoinPoint joinPoint, Throwable exception) {
		String methodName = joinPoint.getSignature().getName();
		log.error("❌ [ERROR] {}() crashed with exception: {}", methodName, exception.getMessage());
	}
}