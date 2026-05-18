import nmap
import boto3
import json
import os

def check_aws_security_groups():
    print("[*] Auditing AWS Security Groups...")
    try:
        ec2 = boto3.client('ec2', region_name='us-east-1')
        sgs = ec2.describe_security_groups()
        vulnerabilities = []

        for sg in sgs['SecurityGroups']:
            for perm in sg.get('IpPermissions', []):
                if perm.get('FromPort') == 5432:
                    for ip_range in perm.get('IpRanges', []):
                        if ip_range.get('CidrIp') == '0.0.0.0/0':
                            vulnerabilities.append(f"VULNERABILITY: SG {sg['GroupId']} ({sg['GroupName']}) exposes port 5432 to 0.0.0.0/0!")
        
        if vulnerabilities:
            print("!!! SECURITY ALERTS FOUND !!!")
            for v in vulnerabilities:
                print(v)
        else:
            print("[+] No public PostgreSQL exposures found in Security Groups.")
    except Exception as e:
        print(f"[-] Error querying AWS: {e}")

def port_scan(target_ip):
    print(f"[*] Auditing Target IP: {target_ip} with python-nmap...")
    nm = nmap.PortScanner()
    try:
        nm.scan(target_ip, '5432')
        state = nm[target_ip]['tcp'][5432]['state']
        if state == 'open':
            print(f"!!! VULNERABILITY: Port 5432 is OPEN on {target_ip} !!!")
        else:
            print(f"[+] Port 5432 is {state} on {target_ip}. Secure.")
    except Exception as e:
        print(f"[-] Error scanning IP {target_ip}: {e}")

if __name__ == "__main__":
    print("--- ASIX SECURITY AUDIT TOOL ---")
    check_aws_security_groups()
    
    target = os.environ.get("TARGET_IP", "127.0.0.1")
    if target != "127.0.0.1":
        port_scan(target)
    else:
        print("[*] Skipping Nmap scan. Set TARGET_IP env variable to scan an external IP.")
