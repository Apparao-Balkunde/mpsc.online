terraform {
  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
  }
}

provider "supabase" {
  access_token = var.supabase_access_token
}

variable "supabase_access_token" {
  type      = string
  sensitive = true
}

variable "organization_id" {
  type = string
}

# फक्त हा एकच रिसोर्स सध्या सपोर्टेड आहे
resource "supabase_project" "mpsc_sarathi" {
  organization_id   = var.organization_id
  name              = "MPSC Sarathi AI"
  database_password = "Tumcha-Kadak-Password-Ithe-Taka" 
  region            = "ap-south-1" # मुंबई रिजन

  lifecycle {
    ignore_changes = [database_password]
  }
}
