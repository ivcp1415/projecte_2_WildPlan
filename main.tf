provider "aws" {
  region = "us-east-1" 
}

# Red propia (VPC) para el nivel Excel·lent
resource "aws_vpc" "senderismo_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = {
    Name = "VPC-Senderismo"
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.senderismo_vpc.id
}

resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.senderismo_vpc.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
}

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.senderismo_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
}

resource "aws_route_table_association" "public_rta" {
  subnet_id      = aws_subnet.public_subnet.id
  route_table_id = aws_route_table.public_rt.id
}

# Seguridad: Puertos 80 (Web) y 22 (SSH)
resource "aws_security_group" "sg_proyecto" {
  name   = "sg_senderismo_3_instancias"
  vpc_id = aws_vpc.senderismo_vpc.id

  # Puerto 80 para la Web
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Puerto 22 para SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Tráfico interno entre servidores
  ingress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    self      = true
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Instalación automática de Docker
locals {
  docker_script = <<-EOF
              #!/bin/bash
              apt-get update -y
              apt-get install -y docker.io docker-compose
              systemctl start docker
              usermod -aG docker ubuntu
              EOF
}

# --- TUS 3 INSTANCIAS (Front, Back, DB) ---
resource "aws_instance" "frontend" {
  ami                    = "ami-0c7217cdde317cfec"
  instance_type          = "t2.micro"
  subnet_id              = aws_subnet.public_subnet.id
  vpc_security_group_ids = [aws_security_group.sg_proyecto.id]
  user_data              = local.docker_script
  tags = {
    Name = "Senderismo-FRONT"
  }
}

resource "aws_instance" "backend" {
  ami                    = "ami-0c7217cdde317cfec"
  instance_type          = "t2.micro"
  subnet_id              = aws_subnet.public_subnet.id
  vpc_security_group_ids = [aws_security_group.sg_proyecto.id]
  user_data              = local.docker_script
  tags = {
    Name = "Senderismo-BACK"
  }
}

resource "aws_instance" "database" {
  ami                    = "ami-0c7217cdde317cfec"
  instance_type          = "t2.micro"
  subnet_id              = aws_subnet.public_subnet.id
  vpc_security_group_ids = [aws_security_group.sg_proyecto.id]
  user_data              = local.docker_script
  tags = {
    Name = "Senderismo-DB"
  }
}

output "IP_FRONT" {
  value = aws_instance.frontend.public_ip
}
output "IP_BACK" {
  value = aws_instance.backend.public_ip
}
output "IP_DB" {
  value = aws_instance.database.public_ip
}