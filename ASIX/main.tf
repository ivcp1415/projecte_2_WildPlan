# =========================================================================
# 1. CONFIGURACIÓN DE TERRAFORM Y PROVIDER
# =========================================================================
terraform {
  # El backend S3 se deja comentado por si usas el entorno local de AWS Academy
  # backend "s3" {
  #   bucket         = "my-terraform-state-bucket-david"
  #   key            = "rutas/terraform.tfstate"
  #   region         = "us-east-1"
  # }
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# =========================================================================
# 2. INFRAESTRUCTURA DE RED (VPC, INTERNET GATEWAY Y SUBREDS)
# =========================================================================
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags                 = { Name = "rutas-vpc" }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "rutas-igw" }
}

# --- SUBREDS PÚBLICAS (Para el Balanceador y el Frontend) ---
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "us-east-1a"
  tags                    = { Name = "rutas-public-1" }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "us-east-1b"
  tags                    = { Name = "rutas-public-2" }
}

# --- SUBREDS PRIVADAS AISLADAS (Para Backend y Base de Datos) ---
resource "aws_subnet" "private_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.3.0/24"
  map_public_ip_on_launch = false
  availability_zone       = "us-east-1a"
  tags                    = { Name = "rutas-private-1" }
}

resource "aws_subnet" "private_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.4.0/24"
  map_public_ip_on_launch = false
  availability_zone       = "us-east-1b"
  tags                    = { Name = "rutas-private-2" }
}

# =========================================================================
# 3. TABLAS DE ENRUTAMIENTO (ROUTING)
# =========================================================================
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  tags = { Name = "rutas-public-rt" }
}

resource "aws_route_table_association" "public_1_assoc" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "public_2_assoc" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table" "private_rt" {
  vpc_id = aws_vpc.main.id
  # Sin ruta al Internet Gateway = Blindaje total contra el exterior
  tags = { Name = "rutas-private-rt" }
}

resource "aws_route_table_association" "private_1_assoc" {
  subnet_id      = aws_subnet.private_1.id
  route_table_id = aws_route_table.private_rt.id
}

resource "aws_route_table_association" "private_2_assoc" {
  subnet_id      = aws_subnet.private_2.id
  route_table_id = aws_route_table.private_rt.id
}

# =========================================================================
# 4. GRUPOS DE SEGURIDAD (SECURITY GROUPS - MÍNIMO PRIVILEGIO)
# =========================================================================

# --- CORTAFUEGOS DEL BALANCEADOR (ALB) ---
resource "aws_security_group" "alb_sg" {
  name        = "rutas-alb-sg"
  description = "Allow HTTP/HTTPS from anywhere"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# --- CORTAFUEGOS DEL FRONTEND ---
resource "aws_security_group" "frontend_sg" {
  name        = "rutas-frontend-sg"
  description = "Allow traffic from ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# --- CORTAFUEGOS INTERNO (Backend y Base de Datos) ---
resource "aws_security_group" "backend_db_sg" {
  name        = "rutas-internal-sg"
  description = "Allow traffic from Frontend and Self"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 0
    to_port         = 0
    protocol        = "-1"
    security_groups = [aws_security_group.frontend_sg.id]
  }
  ingress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    self      = true
  }
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"] # Solo SSH interno
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# =========================================================================
# 5. BALANCEADOR DE CARGA (APPLICATION LOAD BALANCER)
# =========================================================================
resource "aws_lb" "frontend_alb" {
  name               = "rutas-alb-asix" # <-- CAMBIO AQUÍ
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.public_1.id, aws_subnet.public_2.id]
}

resource "aws_lb_target_group" "frontend_tg" {
  name     = "rutas-tg-asix" # <-- CAMBIO AQUÍ
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  health_check {
    path = "/"
    port = "80"
  }
}

# --- LISTENER SEGURO HTTPS (Puerto 443) ---
resource "aws_lb_listener" "frontend_listener_https" {
  load_balancer_arn = aws_lb.frontend_alb.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = "arn:aws:acm:us-east-1:263244526003:certificate/bfd66127-15f5-4227-8970-5d6d45f43334"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend_tg.arn
  }
}

# --- LISTENER HTTP (Puerto 80) MODIFICADO PARA REDIRECCIÓN ---
resource "aws_lb_listener" "frontend_listener_http" {
  load_balancer_arn = aws_lb.frontend_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_target_group_attachment" "frontend_attach" {
  target_group_arn = aws_lb_target_group.frontend_tg.arn
  target_id        = aws_instance.frontend.id
  port             = 80
}
# =========================================================================
# 6. ENCONTRAR IMAGEN UBUNTU AUTOMÁTICAMENTE (AMI)
# =========================================================================
data "aws_ami" "ubuntu" {
  most_recent = true
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
  owners = ["099720109477"] # Canonical
}

# =========================================================================
# 7. MAQUINAS VIRTUALES (INSTANCIAS EC2 Y USER_DATA)
# =========================================================================

# --- MAQUINA 1: FRONTEND (En Subred Pública) ---
resource "aws_instance" "frontend" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public_1.id
  vpc_security_group_ids = [aws_security_group.frontend_sg.id]
  iam_instance_profile   = "LabInstanceProfile"
  key_name               = "vockey"
  user_data              = <<-EOF
              #!/bin/bash
              apt-get update -y
              apt-get install -y docker.io docker-compose wget
              wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
              dpkg -i -E ./amazon-cloudwatch-agent.deb
              /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c ssm:AmazonCloudWatch-linux -s
              EOF

  tags = { Name = "rutas-frontend" }
}

# --- MAQUINA 2: BACKEND (En Subred Privada para mayor seguridad) ---
resource "aws_instance" "backend" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.private_2.id
  vpc_security_group_ids = [aws_security_group.backend_db_sg.id]
  iam_instance_profile   = "LabInstanceProfile"
  key_name               = "vockey"
  user_data              = <<-EOF
              #!/bin/bash
              apt-get update -y
              apt-get install -y docker.io docker-compose wget
              wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
              dpkg -i -E ./amazon-cloudwatch-agent.deb
              /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c ssm:AmazonCloudWatch-linux -s
              EOF

  tags = { Name = "rutas-backend" }
}

# --- MAQUINA 3: BASE DE DATOS (En Subred Privada Aislada) ---
resource "aws_instance" "database" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.private_1.id
  vpc_security_group_ids = [aws_security_group.backend_db_sg.id]
  iam_instance_profile   = "LabInstanceProfile"
  key_name               = "vockey"
  user_data              = <<-EOF
              #!/bin/bash
              apt-get update -y
              apt-get install -y docker.io docker-compose wget
              wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
              dpkg -i -E ./amazon-cloudwatch-agent.deb
              /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c ssm:AmazonCloudWatch-linux -s
              EOF

  tags = { Name = "rutas-database" }
}

# =========================================================================
# 8. OUTPUTS DE CONEXIÓN DEFINITIVOS (CORREGIDOS Y LISTOS)
# =========================================================================
output "ALB_DNS_NAME" {
  value       = aws_lb.frontend_alb.dns_name
  description = "Dirección pública del Balanceador para acceder a la web"
}

output "IP_PRIVADA_BACKEND" {
  value       = aws_instance.backend.private_ip
  description = "IP interna del Backend para la configuración del Frontend"
}

output "IP_PRIVADA_DB" {
  value       = aws_instance.database.private_ip
  description = "IP interna de la Base de Datos para la conexión del Backend"
}