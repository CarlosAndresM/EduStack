CREATE TABLE IF NOT EXISTS educational_levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

-- TABLA DE NIVELES EDUCCATIVOS
INSERT INTO educational_levels (nombre) VALUES
('No especificado'),
('Primaria'),
('Secundaria'),
('Técnico'),
('Estudiante Universitario'),
('Especialista');


-- TABLA DE USUARIOS
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, 
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    educational_level_id INT NOT NULL,
    agreed_terms TINYINT(1) NOT NULL DEFAULT 0,  
    promotional_offers TINYINT(1) NOT NULL DEFAULT 0, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL, 
    profile_picture_url VARCHAR(255) NULL DEFAULT NULL,
    profile_url VARCHAR(255) AS (CONCAT('/', username)) STORED, 
    FOREIGN KEY (educational_level_id) REFERENCES educational_levels(id)
);



-- TABLA DE USUARIOS TEMPORALES AL MOMENTO DEL REGISTRO
CREATE TABLE IF NOT EXISTS users_temp (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    username VARCHAR(100) NOT NULL,
    educational_level_id INT NOT NULL,
    agreed_terms TINYINT(1) NOT NULL,
    promotional_offers TINYINT(1) NOT NULL,
    verification_code VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA DE LOS "ME GUSTAS" A TU CUENTA
CREATE TABLE IF NOT EXISTS likes (
    user_id INT NOT NULL,
    liked_user_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (liked_user_id) REFERENCES users(id),
    PRIMARY KEY (user_id, liked_user_id)
);
-- DEFINIENDO LAS constraints PARA EVITAR DARSE LIKE A SI MISMO
ALTER TABLE likes 
ADD CONSTRAINT check_likes_user_id
CHECK (user_id <> liked_user_id);




select l.user_id, u.username , count(l.liked_user_id) from likes  l
left join users u on u.id = l.user_id
group by user_id