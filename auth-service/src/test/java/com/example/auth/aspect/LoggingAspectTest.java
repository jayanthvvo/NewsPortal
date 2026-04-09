package com.example.auth.aspect;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.Signature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class LoggingAspectTest {

    private LoggingAspect loggingAspect;
    private JoinPoint joinPoint;
    private Signature signature;

    @BeforeEach
    void setUp() {
        loggingAspect = new LoggingAspect();
        joinPoint = mock(JoinPoint.class);
        signature = mock(Signature.class);

        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("testMethod");
    }

    @Test
    void testLogBeforeMethod() {
        Object target = new Object();
        when(joinPoint.getTarget()).thenReturn(target);
        when(joinPoint.getArgs()).thenReturn(new Object[]{"arg1"});

        // Since it's a logger, we are just verifying it doesn't throw exceptions 
        // and covers the lines. True assertions would require intercepting SLF4J logs.
        loggingAspect.logBeforeMethod(joinPoint);
    }

    @Test
    void testLogAfterMethod() {
        loggingAspect.logAfterMethod(joinPoint, "Mock Result");
        loggingAspect.logAfterMethod(joinPoint, null);
    }

    @Test
    void testLogIfException() {
        Exception e = new RuntimeException("Mock Exception");
        loggingAspect.logIfException(joinPoint, e);
    }
}