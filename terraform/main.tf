# १. Provider सेट करणे (Supabase शी कनेक्ट होण्यासाठी)
terraform {
  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
  }
}

provider "supabase" {
  # हे टोकन आपण नंतर GitHub Secrets मधून पास करणार आहोत
  access_token = var.supabase_access_token
}

# २. वेरिएबल्स व्याख्या (सुरक्षिततेसाठी)
variable "supabase_access_token" {
  description = "Supabase Access Token"
  type        = string
  sensitive   = true
}

variable "organization_id" {
  description = "Supabase Organization ID"
  type        = string
}

# ३. नवीन सुपाबेस प्रोजेक्ट तयार करणे
resource "supabase_project" "mpsc_sarathi" {
  organization_id   = var.organization_id
  name              = "MPSC Sarathi AI"
  database_password = "एक-कडक-पासवर्ड-इथे-टाक" # हा पासवर्ड नंतर बदलता येतो
  region            = "ap-south-1"             # मुंबई रिजन (AWS)

  lifecycle {
    ignore_changes = [database_password]
  }
}

# ४. ऑथेंटिकेशन सेटिंग्स (User Login साठी)
resource "supabase_auth_config" "auth" {
  project_id = supabase_project.mpsc_sarathi.id

  external_email_enabled = true
  enable_signup          = true
}

# ५. प्रश्नांच्या इमेजसाठी स्टोरेज बकेट
resource "supabase_storage_bucket" "assets" {
  project_id = supabase_project.mpsc_sarathi.id
  name       = "quiz-assets"
  public     = true
}
