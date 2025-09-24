# Credentials Folder

## The purpose of this folder is to store all credentials needed to log into your server and databases. This is important for many reasons. But the two most important reasons is
    1. Grading , servers and databases will be logged into to check code and functionality of application. Not changes will be unless directed and coordinated with the team.
    2. Help. If a class TA or class CTO needs to help a team with an issue, this folder will help facilitate this giving the TA or CTO all needed info AND instructions for logging into your team's server. 


# Below is a list of items required. Missing items will causes points to be deducted from multiple milestone submissions.

1. Server URL or IP
2. SSH username
3. SSH password or key.
    <br> If a ssh key is used please upload the key to the credentials folder.
4. Database URL or IP and port used.
    <br><strong> NOTE THIS DOES NOT MEAN YOUR DATABASE NEEDS A PUBLIC FACING PORT.</strong> But knowing the IP and port number will help with SSH tunneling into the database. The default port is more than sufficient for this class.
5. Database username
6. Database password
7. Database name (basically the name that contains all your tables)
8. Instructions on how to use the above information.

# Most important things to Remember
## These values need to kept update to date throughout the semester. <br>
## <strong>Failure to do so will result it points be deducted from milestone submissions.</strong><br>
## You may store the most of the above in this README.md file. DO NOT Store the SSH key or any keys in this README.md file.

---
# CSC 648 Team 08 – Credentials

## Server Information
- **Server IP**: 3.101.155.82  
- **SSH Access**: via SSH keys only (no password authentication)

### SSH Users with sudo access
- `profsouza` (professor/CTO)  
- `ubuntu` (default AWS admin user)  
- `atharva` (team member)  

### SSH Users without sudo access
- `sonam`  
- `sally`  
- `addy`  
- `koji`  
- `krinjal`  

---

## Database Information
- **Host**: 127.0.0.1 (localhost only)  
- **Port**: 3306  
- **Database Username**: root  
- **Database Password**: CSC648  
- **Database Name**: team08_db  
- **Additional User**: profsouza (full privileges)  
- **Database Version**: MySQL 8.0.43  

---

## Authentication
- All users authenticate using SSH keys only.  
- Each user’s **public key** is stored in the `access_keys/` subfolder of this directory.  
- The AWS EC2 **launch key** (`team08.pem`) is included here only because required for grading.    
- SSH Key Type: ED25519  

---

## Instructions for Access

### SSH
```bash
# General form
ssh -i <path-to-your-private-key> <username>@3.101.155.82

# Examples
ssh -i ~/.ssh/id_ed25519 ubuntu@3.101.155.82
ssh -i ~/.ssh/id_ed25519 atharva@3.101.155.82
ssh -i ~/.ssh/id_ed25519 profsouza@3.101.155.82
Database
# From the server (after SSH connection):
mysql -u root -p team08_db
# Password: CSC648

# For professor access:
mysql -u profsouza -p team08_db
# Password: CSC648