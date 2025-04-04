-- MySQL dump 10.13  Distrib 8.0.19, for Win64 (x86_64)
--
-- Host: localhost    Database: nutrilife
-- ------------------------------------------------------
-- Server version	8.3.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `appointments`
--

DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `nutritionist_id` int NOT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL,
  `status` enum('Pending','Confirmed','Denied') NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `appointments_users_FK` FOREIGN KEY (`id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments`
--

LOCK TABLES `appointments` WRITE;
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
INSERT INTO `appointments` VALUES (1,1,1,'2023-10-01','10:00:00','Confirmed'),(2,1,1,'2023-10-01','10:00:00','Confirmed'),(3,1,1,'2023-10-01','10:00:00','Confirmed');
/*!40000 ALTER TABLE `appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contactform`
--

DROP TABLE IF EXISTS `contactform`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contactform` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fullName` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `topic` enum('Consultation','Meal Plans','Support','Other') NOT NULL,
  `message` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contactform`
--

LOCK TABLES `contactform` WRITE;
/*!40000 ALTER TABLE `contactform` DISABLE KEYS */;
INSERT INTO `contactform` VALUES (1,'John Doe','john@example.com','Consultation','I would like to know more about your services and schedule a consultation.');
/*!40000 ALTER TABLE `contactform` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `healthgoals`
--

DROP TABLE IF EXISTS `healthgoals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `healthgoals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `goal_type` set('LoseWeight','BuildMuscle','ImproveStamina','EatHealthier','ReduceStress','ImproveSleep','IncreaseEnergy','MentalClarity','BoostImmunity') NOT NULL,
  `target_value` varchar(100) NOT NULL,
  `current_value` varchar(100) NOT NULL,
  `deadline` date NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `healthgoals_users_FK` FOREIGN KEY (`id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `healthgoals`
--

LOCK TABLES `healthgoals` WRITE;
/*!40000 ALTER TABLE `healthgoals` DISABLE KEYS */;
INSERT INTO `healthgoals` VALUES (1,1,'LoseWeight','70','80','2024-01-01');
/*!40000 ALTER TABLE `healthgoals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mealplans`
--

DROP TABLE IF EXISTS `mealplans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mealplans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `nutritionist_id` int NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` longtext NOT NULL,
  `meals` longtext NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `mealplans_users_FK` FOREIGN KEY (`id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mealplans`
--

LOCK TABLES `mealplans` WRITE;
/*!40000 ALTER TABLE `mealplans` DISABLE KEYS */;
INSERT INTO `mealplans` VALUES (1,1,1,'Keto','Keto meal plan for weight loss','{\"Breakfast\":\"Eggs and Avocado\",\"Lunch\":\"Grilled Chicken Salad\",\"Dinner\":\"Salmon with Asparagus\"}'),(2,1,1,'Keto','Keto meal plan for weight loss','{\"Breakfast\":\"Eggs and Avocado\",\"Lunch\":\"Grilled Chicken Salad\",\"Dinner\":\"Salmon with Asparagus\"}'),(3,1,1,'Keto','Keto meal plan for weight loss','{\"Breakfast\":\"Eggs and Avocado\",\"Lunch\":\"Grilled Chicken Salad\",\"Dinner\":\"Salmon with Asparagus\"}');
/*!40000 ALTER TABLE `mealplans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  `role` enum('Client','Nutritionist') NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'John Doe','john@example.com','$2y$10$HWa1pKwvUXa21gulBiPgT.pTpp7nOhGsTuyQi.sgW/4TlYuwaAQdW','Client'),(2,'John Doe','john@example.com','$2y$10$VpYp1iFI4qFmvgxDrPt9YeFD6VfAVhILTsB.bqK6u.Dwtbc3zFOou','Client'),(3,'John Doe','john@example.com','$2y$10$ajgY7RKyCC13ubXmbQR7zOcjlr57I64DxvQf7OcfyY9aGdxD095Q6','Client'),(4,'John Doe','john@example.com','$2y$10$WM260XJH/pY2fAwg.gEnSu1AVZhdsFJFMe0v8A554wMjK2PCf/rSK','Client'),(5,'John Doe','john@example.com','$2y$10$8kax21UCK304gQE.T9.Z8uOtfcE.6rMQLpOaxo.lERAX0gqqtREji','Client');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'nutrilife'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-01 19:56:55
