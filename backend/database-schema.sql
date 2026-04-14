-- =====================================================
-- SENTRIX RBAC & Security Monitoring System
-- Database Schema - MySQL
-- =====================================================

DROP DATABASE IF EXISTS sentrix_security;
CREATE DATABASE sentrix_security;
USE sentrix_security;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users Table
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    status ENUM('active', 'inactive', 'suspended', 'blocked') DEFAULT 'active',
    is_email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL,
    last_login_ip VARCHAR(45) NULL,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- Roles Table
CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    priority INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role_name (role_name)
) ENGINE=InnoDB;

-- Permissions Table
CREATE TABLE permissions (
    permission_id INT AUTO_INCREMENT PRIMARY KEY,
    permission_name VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_resource (resource),
    INDEX idx_permission_name (permission_name)
) ENGINE=InnoDB;

-- =====================================================
-- RELATIONSHIP TABLES (Many-to-Many)
-- =====================================================

-- User-Role Mapping
CREATE TABLE user_roles (
    user_role_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INT NULL,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(user_id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_role (user_id, role_id),
    INDEX idx_user_id (user_id),
    INDEX idx_role_id (role_id)
) ENGINE=InnoDB;

-- Role-Permission Mapping
CREATE TABLE role_permissions (
    role_permission_id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by INT NULL,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(user_id) ON DELETE SET NULL,
    UNIQUE KEY unique_role_permission (role_id, permission_id),
    INDEX idx_role_id (role_id),
    INDEX idx_permission_id (permission_id)
) ENGINE=InnoDB;

-- =====================================================
-- SECURITY & LOGGING TABLES
-- =====================================================

-- Login Logs
CREATE TABLE login_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    username VARCHAR(50),
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    device_type VARCHAR(50),
    browser VARCHAR(50),
    os VARCHAR(50),
    country VARCHAR(100),
    city VARCHAR(100),
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    login_status ENUM('success', 'failed', 'blocked') NOT NULL,
    failure_reason VARCHAR(255) NULL,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_ip_address (ip_address),
    INDEX idx_login_status (login_status),
    INDEX idx_attempted_at (attempted_at)
) ENGINE=InnoDB;

-- Access Attempts (Failed/Suspicious)
CREATE TABLE access_attempts (
    attempt_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50),
    ip_address VARCHAR(45) NOT NULL,
    attempt_type ENUM('login', 'api', 'admin') DEFAULT 'login',
    endpoint VARCHAR(255) NULL,
    method VARCHAR(10) NULL,
    status_code INT NULL,
    is_suspicious BOOLEAN DEFAULT FALSE,
    risk_score INT DEFAULT 0,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ip_address (ip_address),
    INDEX idx_username (username),
    INDEX idx_is_suspicious (is_suspicious),
    INDEX idx_attempted_at (attempted_at)
) ENGINE=InnoDB;

-- Active Sessions
CREATE TABLE sessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255) NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    device_fingerprint VARCHAR(255) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token_hash (token_hash),
    INDEX idx_is_active (is_active),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB;

-- Blocked IPs
CREATE TABLE blocked_ips (
    block_id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) UNIQUE NOT NULL,
    reason VARCHAR(255) NOT NULL,
    block_type ENUM('manual', 'auto', 'temporary') DEFAULT 'manual',
    blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    blocked_by INT NULL,
    expires_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    attempts_count INT DEFAULT 0,
    FOREIGN KEY (blocked_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_ip_address (ip_address),
    INDEX idx_is_active (is_active),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB;

-- Audit Trails (Complete Activity Log)
CREATE TABLE audit_trails (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    username VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id INT NULL,
    endpoint VARCHAR(255),
    method VARCHAR(10),
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_body TEXT NULL,
    response_status INT NULL,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT NULL,
    session_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_resource_type (resource_type),
    INDEX idx_ip_address (ip_address),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- Security Alerts
CREATE TABLE security_alerts (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    alert_type ENUM('failed_login', 'new_location', 'unusual_time', 'multiple_ips', 'privilege_escalation', 'suspicious_activity') NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    user_id INT NULL,
    ip_address VARCHAR(45) NULL,
    description TEXT NOT NULL,
    metadata JSON NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by INT NULL,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_alert_type (alert_type),
    INDEX idx_severity (severity),
    INDEX idx_user_id (user_id),
    INDEX idx_is_resolved (is_resolved),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- Password Reset Tokens
CREATE TABLE password_reset_tokens (
    token_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_token_hash (token_hash),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB;

-- =====================================================
-- INITIAL DATA (Seed)
-- =====================================================

-- Insert Default Roles
INSERT INTO roles (role_name, description, priority) VALUES
('Super Admin', 'Full system access with all permissions', 100),
('Admin', 'Administrative access with most permissions', 80),
('Security Analyst', 'Access to security logs and monitoring', 60),
('User Manager', 'Can manage users and assign basic roles', 50),
('User', 'Standard user with basic permissions', 10),
('Guest', 'Limited read-only access', 5);

-- Insert Default Permissions
INSERT INTO permissions (permission_name, resource, action, description) VALUES
-- User Management
('user.create', 'user', 'create', 'Create new users'),
('user.read', 'user', 'read', 'View user information'),
('user.update', 'user', 'update', 'Update user information'),
('user.delete', 'user', 'delete', 'Delete users'),
('user.block', 'user', 'block', 'Block/unblock users'),

-- Role Management
('role.create', 'role', 'create', 'Create new roles'),
('role.read', 'role', 'read', 'View roles'),
('role.update', 'role', 'update', 'Update roles'),
('role.delete', 'role', 'delete', 'Delete roles'),
('role.assign', 'role', 'assign', 'Assign roles to users'),

-- Permission Management
('permission.create', 'permission', 'create', 'Create permissions'),
('permission.read', 'permission', 'read', 'View permissions'),
('permission.update', 'permission', 'update', 'Update permissions'),
('permission.delete', 'permission', 'delete', 'Delete permissions'),
('permission.assign', 'permission', 'assign', 'Assign permissions to roles'),

-- Logs & Monitoring
('logs.read', 'logs', 'read', 'View system logs'),
('logs.export', 'logs', 'export', 'Export log data'),
('alerts.read', 'alerts', 'read', 'View security alerts'),
('alerts.manage', 'alerts', 'manage', 'Manage security alerts'),

-- IP Management
('ip.block', 'ip', 'block', 'Block IP addresses'),
('ip.unblock', 'ip', 'unblock', 'Unblock IP addresses'),
('ip.view', 'ip', 'view', 'View blocked IPs'),

-- Audit
('audit.read', 'audit', 'read', 'View audit trails'),
('audit.export', 'audit', 'export', 'Export audit data'),

-- System
('system.config', 'system', 'config', 'Configure system settings'),
('system.stats', 'system', 'stats', 'View system statistics');

-- Assign Permissions to Super Admin (All Permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, permission_id FROM permissions;

-- Assign Permissions to Admin (Most Permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, permission_id FROM permissions 
WHERE permission_name NOT IN ('system.config', 'role.delete', 'permission.delete');

-- Assign Permissions to Security Analyst
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, permission_id FROM permissions 
WHERE resource IN ('logs', 'alerts', 'audit', 'ip') OR permission_name = 'user.read';

-- Assign Permissions to User Manager
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, permission_id FROM permissions 
WHERE resource = 'user' OR permission_name IN ('role.read', 'role.assign');

-- Assign Permissions to User (Basic Access)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 5, permission_id FROM permissions 
WHERE permission_name IN ('user.read', 'role.read');

-- Create Default Admin User (password: Admin@123)
-- Note: This password hash is for 'Admin@123' - CHANGE IN PRODUCTION!
INSERT INTO users (username, email, password_hash, full_name, status, is_email_verified) VALUES
('admin', 'admin@sentrix.com', '$2b$10$Vd3PlvZERduS8YfPrKVLQe8Z1P0hhHaUZKxB/qxI5TANJa0x7SJOG', 'System Administrator', 'active', TRUE);

-- Assign Super Admin role to default admin
INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES
(1, 1, 1);

-- =====================================================
-- STORED PROCEDURES & FUNCTIONS
-- =====================================================

DELIMITER $$

-- Procedure to check user permissions
CREATE PROCEDURE check_user_permission(
    IN p_user_id INT,
    IN p_permission_name VARCHAR(100),
    OUT has_permission BOOLEAN
)
BEGIN
    SELECT COUNT(*) > 0 INTO has_permission
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.permission_id
    WHERE ur.user_id = p_user_id 
    AND p.permission_name = p_permission_name
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW());
END$$

-- Function to get user's highest role priority
CREATE FUNCTION get_user_priority(p_user_id INT)
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE max_priority INT;
    SELECT COALESCE(MAX(r.priority), 0) INTO max_priority
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.role_id
    WHERE ur.user_id = p_user_id
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW());
    RETURN max_priority;
END$$

-- Procedure to log security alert
CREATE PROCEDURE log_security_alert(
    IN p_alert_type VARCHAR(50),
    IN p_severity VARCHAR(20),
    IN p_user_id INT,
    IN p_ip_address VARCHAR(45),
    IN p_description TEXT,
    IN p_metadata JSON
)
BEGIN
    INSERT INTO security_alerts (alert_type, severity, user_id, ip_address, description, metadata)
    VALUES (p_alert_type, p_severity, p_user_id, p_ip_address, p_description, p_metadata);
END$$

DELIMITER ;

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- Active Users with Roles
CREATE VIEW v_active_users AS
SELECT 
    u.user_id,
    u.username,
    u.email,
    u.full_name,
    u.status,
    u.last_login,
    GROUP_CONCAT(r.role_name ORDER BY r.priority DESC) AS roles
FROM users u
LEFT JOIN user_roles ur ON u.user_id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.role_id
WHERE u.status = 'active'
GROUP BY u.user_id;

-- Failed Login Summary
CREATE VIEW v_failed_login_summary AS
SELECT 
    DATE(attempted_at) AS date,
    COUNT(*) AS failed_attempts,
    COUNT(DISTINCT ip_address) AS unique_ips,
    COUNT(DISTINCT username) AS unique_users
FROM login_logs
WHERE login_status = 'failed'
GROUP BY DATE(attempted_at)
ORDER BY date DESC;

-- Top Suspicious IPs
CREATE VIEW v_suspicious_ips AS
SELECT 
    ip_address,
    COUNT(*) AS attempt_count,
    MAX(attempted_at) AS last_attempt,
    SUM(risk_score) AS total_risk_score
FROM access_attempts
WHERE is_suspicious = TRUE
GROUP BY ip_address
ORDER BY total_risk_score DESC;

-- Recent Security Alerts
CREATE VIEW v_recent_alerts AS
SELECT 
    sa.alert_id,
    sa.alert_type,
    sa.severity,
    u.username,
    sa.ip_address,
    sa.description,
    sa.is_resolved,
    sa.created_at
FROM security_alerts sa
LEFT JOIN users u ON sa.user_id = u.user_id
ORDER BY sa.created_at DESC;

COMMIT;