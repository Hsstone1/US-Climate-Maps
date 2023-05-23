from macpath import split
from tracemalloc import start
from typing import List
import sys
import requests
import datetime
import math
import csv
import os


from bs4 import BeautifulSoup

def weatherRequest(site, issued, version):
    url = f"https://forecast.weather.gov/product.php?site={site}&issuedby={issued}&product=CF6&format=TXT&version={version}&glossary=0"
    response = requests.get(url)
    return BeautifulSoup(response.content, 'html.parser')

def convertLineToDict(line):

    dict = {
        "DY"    : 0,
        "MAX"   : '',
        "MIN"   : '',
        "AVG"   : '',
        "DEP"   : '',
        "HDD"   : '',
        "CDD"   : '',
        "WTR"   : '',
        "SNW"   : '',
        "DPTH"  : '',
        "ASPD"  : '',
        "MSPD"  : '',
        "ADIR"  : '',
        "SSMIN" : '',
        "PSBL"  : '',
        "S-S"   : '',
        "WX"    : '',
        "SPD"   : '',
        "DR"    : ''
    }
    splitArr = line.split()
    dict["DY"] = splitArr[0]
    dict["MAX"] = splitArr[1]
    dict["MIN"] = splitArr[2]
    dict["AVG"] = splitArr[3]
    dict["DEP"] = splitArr[4]
    dict["HDD"] = splitArr[5]
    dict["CDD"] = splitArr[6]
    dict["WTR"] = splitArr[7]
    dict["SNW"] = splitArr[8]
    dict["DPTH"] = splitArr[9]
    dict["ASPD"] = splitArr[10]
    dict["MSPD"] = splitArr[11]
    dict["ADIR"] = splitArr[12]
    dict["SSMIN"] = splitArr[13]
    dict["PSBL"] = splitArr[14]
    dict["S-S"] = splitArr[15]
    
    if len(splitArr) == 18:
        dict["WX"] = ""
        dict["SPD"] = splitArr[16]
        dict["DR"] = splitArr[17]
    elif len(splitArr) == 19:
        dict["WX"] = splitArr[16]
        dict["SPD"] = splitArr[17]
        dict["DR"] = splitArr[18]

    return dict
    
def trunc_str(value):
    return '{message:{fill}{align}{width}}'.format(
        message = round(value, 2),
        fill=' ',
        align='<',
        width=10,
    )   
    #return round(value, 2)

def month_name_to_num(month_name):
    month_switch = {
        'JANUARY': 1,
        'FEBRUARY': 2,
        'MARCH': 3,
        'APRIL': 4,
        'MAY': 5,
        'JUNE': 6,
        'JULY': 7,
        'AUGUST': 8,
        'SEPTEMBER': 9,
        'OCTOBER': 10,
        'NOVEMBER': 11,
        'DECEMBER': 12,
    }
    
    return month_switch.get(month_name.upper(), -1)

def main():
    #original_stdout = sys.stdout
    
    CF6_ACRONYMS = [
        'AFG,FAI',
        'AFG,BRW',
        'AFG,OTZ',
        'AFG,OME',
        'AFG,MCG',
        'AFC,ANC',
        'AFC,BET',
        'AFC,CDB',
        'AFC,AKN',
        'AFC,ADQ',
        'AFC,SNP',
        'AJK,AJN',
        'AJK,YAK',
        'AJK,ASI',
        'AJK,KTN',
        'SEW,SEA',
        'SEW,OLM',
        'SEW,SEW',
        'SEW,UIL',
        'SEW,BLI',
        'SEW,HQM',
        'PQR,AST',
        'PQR,UAO',
        'PQR,EUG',
        'PQR,HIO',
        'PQR,MMV',
        'PQR,PDX',
        'PQR,RDM',
        'PQR,RBG',
        'PQR,SLE',
        'PQR,SPB',
        'PQR,DLS',
        'PQR,TTD',
        'PQR,VUO',
        'OTX,GEG',
        'OTX,SFF',
        'OTX,DEW',
        'OTX,PUW',
        'OTX,LWS',
        'OTX,MWH',
        'OTX,EPH',
        'OTX,EAT',
        'OTX,OMK',
        'PDT,PDT',
        'PDT,MEH',
        'PDT,RDM',
        'PDT,DLS',
        'PDT,ELN',
        'PDT,PSC',
        'PDT,YKM',
        'PDT,ALW',
        'PDT,HRI',
        'MSO,MSO',
        'MSO,GPI',
        'MSO,BTM',
        'BOI,BOI',
        'BOI,BKE',
        'BOI,BNO',
        'BOI,JER',
        'BOI,MYL',
        'BOI,MUO',
        'BOI,ONO',
        'BOI,REO',
        'BOI,TWF',
        'TFX,BZN',
        'TFX,CTB',
        'TFX,DLN',
        'TFX,GTF',
        'TFX,HVR',
        'TFX,HLN',
        'TFX,LWT',
        'GGW,GGW',
        'GGW,JDN',
        'GGW,OLF',
        'PIH,BYI',
        'PIH,LLJ',
        'PIH,IDA',
        'PIH,PIH',
        'PIH,RXE',
        'PIH,SNT',
        'STO,Blu',
        'STO,STO',
        'STO,MYV',
        'STO,MOD',
        'STO,OVE',
        'STO,RDD',
        'STO,RBL',
        'STO,SAC',
        'STO,SMF',
        'STO,SCK',
        'STO,VCB',
        'EKA,ACV',
        'EKA,CEC',
        'EKA,EKA',
        'EKA,UKI',
        'MTR,STS',
        'MTR,APC',
        'MTR,SFD',
        'MTR,SFO',
        'MTR,OAK',
        'MTR,CCR',
        'MTR,LVK',
        'MTR,HWD',
        'MTR,SJC',
        'MTR,WVI',
        'MTR,MRY',
        'MTR,SNS',
        'LOX,BUR',
        'LOX,CMA',
        'LOX,HHR',
        'LOX,WJF',
        'LOX,LAX',
        'LOX,CQT',
        'LOX,LGB',
        'LOX,OXR',
        'LOX,PMD',
        'LOX,PRB',
        'LOX,SBP',
        'LOX,SBA',
        'LOX,SMX',
        'LOX,SMO',
        'LOX,SDB',
        'LOX,VNY',
        'MFR,AAT',
        'MFR,LMT',
        'MFR,MFR',
        'MFR,SIY',
        'MFR,MHS',
        'MFR,OTH',
        'MFR,RBG',
        'REV,RNO',
        'REV,TVL',
        'HNX,FAT',
        'HNX,BFL',
        'HNX,MCE',
        'HNX,MAE',
        'HNX,HJO',
        'SGX,CRQ',
        'SGX,CNO',
        'SGX,FUL',
        'SGX,SNA',
        'SGX,OKB',
        'SGX,ONT',
        'SGX,PSP',
        'SGX,RAL',
        'SGX,RIV',
        'SGX,RNM',
        'SGX,SAN',
        'SGX,SDM',
        'SGX,MYF',
        'SGX,TRM',
        'LKN,EKO',
        'LKN,ELY',
        'LKN,P68',
        'LKN,TPH',
        'LKN,WMC',
        'VEF,LAS',
        'VEF,VGT',
        'VEF,DRA',
        'VEF,IGM',
        'VEF,DAG',
        'VEF,EED',
        'VEF,BIH',
        'VEF,DVF',
        'PSR,PHX',
        'PSR,NYL',
        'PSR,IPL',
        'PSR,DVT',
        'PSR,SDL',
        'PSR,FFZ',
        'PSR,BLH',
        'SLC,EVW',
        'SLC,CDC',
        'SLC,SLC',
        'RIW,BPI',
        'RIW,BYG',
        'RIW,CPR',
        'RIW,COD',
        'RIW,GEY',
        'RIW,JAC',
        'RIW,P60',
        'RIW,LND',
        'RIW,RIW',
        'RIW,RKS',
        'RIW,WRL',
        'BYZ,BIL',
        'BYZ,MLS',
        'BYZ,LVM',
        'BYZ,SHR',
        'BYZ,BHK',
        'FGZ,FLG',
        'FGZ,PRC',
        'FGZ,INW',
        'FGZ,GCN',
        'FGZ,PGA',
        'FGZ,SJN',
        'FGZ,RQE',
        'TWC,TUS',
        'TWC,OLS',
        'TWC,SAD',
        'TWC,DUG',
        'EPZ,ELP',
        'EPZ,DMN',
        'EPZ,TCS',
        'EPZ,SVC',
        'EPZ,SRR',
        'EPZ,ALM',
        'EPZ,LRU',
        'ABQ,ABQ',
        'ABQ,CAO',
        'ABQ,FMN',
        'ABQ,GUP',
        'ABQ,LVS',
        'ABQ,RTN',
        'ABQ,ROW',
        'ABQ,SAF',
        'ABQ,TCC',
        'AMA,AMA',
        'AMA,BGD',
        'AMA,DHT',
        'AMA,GUY',
        'LUB,LBB',
        'LUB,CDS',
        'MAF,E38',
        'MAF,E11',
        'MAF,ATS',
        'MAF,E41',
        'MAF,BPG',
        'MAF,CNM',
        'MAF,6R6',
        'MAF,FST',
        'MAF,GDP',
        'MAF,HOB',
        'MAF,T89',
        'MAF,LUV',
        'MAF,MRF',
        'MAF,MDD',
        'MAF,MAF',
        'MAF,MRF',
        'MAF,ODO',
        'MAF,PEQ',
        'MAF,PRS',
        'MAF,GNC',
        'MAF,SNK',
        'MAF,VHN',
        'MAF,INK',
        'SJT,ABI',
        'SJT,SJT',
        'SJT,JCT',
        'EWX,AUS',
        'EWX,ATT',
        'EWX,DRT',
        'EWX,SAT',
        'EWX,5C1',
        'EWX,BMQ',
        'EWX,CZT',
        'EWX,5T9',
        'EWX,T82',
        'EWX,GTU',
        'EWX,GYB',
        'EWX,T20',
        'EWX,HDO',
        'EWX,DZB',
        'EWX,2R9',
        'EWX,ERV',
        'EWX,RYW',
        'EWX,3T5',
        'EWX,DLF',
        'EWX,AQO',
        'EWX,BAZ',
        'EWX,EDC',
        'EWX,PEZ',
        'EWX,RND',
        'EWX,ECU',
        'EWX,SKF',
        'EWX,SSF',
        'EWX,HYI',
        'EWX,SEQ',
        'EWX,T74',
        'EWX,UVA',
        'EWX,CVB',
        'EWX,FTN',
        'EWX,T70',
        'CRP,CRP',
        'CRP,VCT',
        'CRP,LRD',
        'CRP,COT',
        'CRP,ALI',
        'CRP,RKP',
        'BRO,MFE',
        'BRO,HRL',
        'BRO,PIL',
        'BRO,BRO',
        'HGX,IAH',
        'HGX,HOU',
        'HGX,GLS',
        'HGX,CLL',
        'HGX,CXO',
        'HGX,DWH',
        'HGX,LBX',
        'HGX,LVJ',
        'HGX,PSX',
        'HGX,SGR',
        'HGX,UTS',
        'HGX,HGX',
        'HGX,ARM',
        'HGX,11R',
        'HGX,BYY',
        'FWD,DFW',
        'FWD,ACT',
        'FWD,DAL',
        'FWD,GKY',
        'FWD,F44',
        'FWD,0F2',
        'FWD,XBP',
        'FWD,T35',
        'FWD,CPT',
        'FWD,MKN',
        'FWD,CRS',
        'FWD,RBD',
        'FWD,LUD',
        'FWD,DTO',
        'FWD,FTW',
        'FWD,AFW',
        'FWD,GLE',
        'FWD,GOP',
        'FWD,RPH',
        'FWD,GDJ',
        'FWD,GVT',
        'FWD,LHB',
        'FWD,INJ',
        'FWD,ILE',
        'FWD,TKI',
        'FWD,MWL',
        'FWD,PSN',
        'FWD,PRX',
        'FWD,F46',
        'FWD,GYI',
        'FWD,SEP',
        'FWD,TPL',
        'FWD,TRL',
        'FWD,PWG',
        'FWD,JWY',
        'OUN,OKC',
        'OUN,SPS',
        'OUN,CSM',
        'OUN,FDR',
        'OUN,GAG',
        'OUN,GOK',
        'OUN,HBR',
        'OUN,LAW',
        'OUN,PNC',
        'OUN,SWO',
        'OUN,PWA',
        'SHV,SHV',
        'SHV,MLU',
        'SHV,TXK',
        'SHV,ELD',
        'SHV,DEQ',
        'SHV,TYR',
        'SHV,GGG',
        'SHV,LFK',
        'LCH,LCH',
        'LCH,AEX',
        'LCH,ARA',
        'LCH,BPT',
        'LCH,LFT',
        'TSA,TUL',
        'TSA,FSM',
        'TSA,BVO',
        'TSA,FYV',
        'TSA,RVS',
        'TSA,MLC',
        'TSA,MKO',
        'TSA,XNA',
        'LZK,LIT',
        'LZK,LZK',
        'LZK,LRF',
        'LZK,HRO',
        'LZK,PBF',
        'LZK,LLQ',
        'LZK,BPK',
        'LZK,SRC',
        'LZK,RUE',
        'LZK,MWT',
        'LZK,HOT',
        'LZK,FLP',
        'LZK,SGT',
        'LZK,BVX',
        'LZK,ADF',
        'LZK,MEZ',
        'LZK,CCA',
        'LZK,CXW',
        'LZK,ARG',
        'LIX,BTR',
        'LIX,MSY',
        'LIX,GPT',
        'LIX,MCB',
        'LIX,NEW',
        'LIX,PQL',
        'LIX,ASD',
        'JAN,GLH',
        'JAN,GWO',
        'JAN,HBG',
        'JAN,HKS',
        'JAN,JAN',
        'JAN,MEI',
        'JAN,TVR',
        'MEG,MEM',
        'MEG,MKL',
        'MEG,JBR',
        'MEG,TUP',
        'MEG,MEG',
        'MOB,MOB',
        'MOB,PNS',
        'BMX,ANB',
        'BMX,AUO',
        'BMX,BHM',
        'BMX,EET',
        'BMX,MGM',
        'BMX,TCL',
        'BMX,TOI',
        'HUN,HSV',
        'HUN,MSL',
        'HUN,DCU',
        'OHX,CKV',
        'OHX,CSV',
        'OHX,BNA',
        'HFO,HNL',
        'HFO,ITO',
        'HFO,OGG',
        'HFO,KOA',
        'HFO,JRF',
        'HFO,NGF',
        'HFO,LIH',
        'HFO,MKK',
        'KEY,EYW',
        'KEY,MTH',
        'KEY,KEY',
        'MFL,MIA',
        'MFL,FLL',
        'MFL,PBI',
        'MFL,APF',
        'MFL,TMB',
        'MFL,OPF',
        'MFL,FXE',
        'MFL,HWO',
        'MFL,PMP',
        'MLB,DAB',
        'MLB,MCO',
        'MLB,MLB',
        'MLB,VRB',
        'MLB,ORL',
        'MLB,SFB',
        'MLB,FPR',
        'MLB,LEE',
        'TBW,TPA',
        'TBW,LAL',
        'TBW,SRQ',
        'TBW,FMY',
        'TBW,BKV',
        'TBW,PIE',
        'TBW,SPG',
        'TBW,GIF',
        'TBW,PGD',
        'TBW,RSW',
        'TBW,TBW',
        'TAE,TLH',
        'TAE,AAF',
        'TAE,ECP',
        'TAE,MAI',
        'TAE,DHN',
        'TAE,ABY',
        'TAE,VLD',
        'JAX,JAX',
        'JAX,CRG',
        'JAX,SSI',
        'JAX,GNV',
        'JAX,GNV',
        'FFC,ATL',
        'FFC,AHN',
        'FFC,CSG',
        'FFC,MCN',
        'FFC,VPC',
        'FFC,PDK',
        'FFC,FTY',
        'FFC,GVL',
        'FFC,FFC',
        'FFC,RMG',
        'BOU,DEN',
        'BOU,AKO',
        'BOU,APA',
        'BOU,LIC',
        'BOU,GXY',
        'BOU,FNL',
        'BOU,BDU',
        'BOU,33V',
        'BOU,20V',
        'BOU,CCU',
        'BOU,MNH',
        'GJT,GJT',
        'GJT,RIL',
        'GJT,MTJ',
        'GJT,DRO',
        'GJT,CEZ',
        'GJT,CAG',
        'GJT,EEO',
        'GJT,ASE',
        'GJT,CNY',
        'GJT,VEL',
        'GJT,DEN',
        'GJT,SLC',
        'PUB,ALS',
        'PUB,COS',
        'PUB,PUB',
        'PUB,LHX',
        'PUB,LAA',
        'PUB,LXV',
        'PUB,SPD',
        'PUB,TAD',
        'GLD,ITR',
        'GLD,GLD',
        'GLD,HLC',
        'GLD,MCK',
        'DDC,DDC',
        'DDC,GCK',
        'DDC,P28',
        'UNR,RAP',
        'UNR,UNR',
        'UNR,2WX',
        'UNR,CUT',
        'UNR,D07',
        'UNR,PHP',
        'UNR,IEN',
        'UNR,ICR',
        'UNR,GCC',
        'ABR,ABR',
        'ABR,PIR',
        'ABR,ATY',
        'ABR,MBG',
        'ABR,8D3',
        'ABR,FSD',
        'ABR,UNR',
        'ABR,RAP',
        'ABR,HON',
        'BIS,BIS',
        'BIS,XWA',
        'BIS,DIK',
        'BIS,JMS',
        'BIS,MOT',
        'BIS,N60',
        'BIS,HEI',
        'FGF,GFK',
        'FGF,FAR',
        'FGF,FGF',
        'CYS,AIA',
        'CYS,CDR',
        'CYS,CYS',
        'CYS,DGW',
        'CYS,LAR',
        'CYS,RWL',
        'CYS,BFF',
        'CYS,SNY',
        'CYS,TOR',
        'LBF,BBW',
        'LBF,IML',
        'LBF,LBF',
        'LBF,VTN',
        'GID,AUH',
        'GID,GRI',
        'GID,HSI',
        'GID,HJH',
        'GID,HDE',
        'GID,EAR',
        'GID,LXN',
        'GID,ODX',
        'GID,JYR',
        'ICT,ICT',
        'ICT,SLN',
        'ICT,CNU',
        'TOP,TOP',
        'TOP,CNK',
        'TOP,MHK',
        'TOP,LWC',
        'TOP,EMP',
        'OAX,OMA',
        'OAX,LNK',
        'OAX,OFK',
        'OAX,OAX',
        'OAX,TQE',
        'OAX,FNB',
        'FSD,FSD',
        'FSD,SUX',
        'FSD,HON',
        'FSD,MHE',
        'MPX,MSP',
        'MPX,STC',
        'MPX,EAU',
        'MPX,MPX',
        'MPX,RWF',
        'MPX,MKT',
        'EAX,MCI',
        'EAX,STJ',
        'EAX,MKC',
        'EAX,LXT',
        'EAX,IXD',
        'EAX,OJC',
        'EAX,EAX',
        'EAX,CDJ',
        'EAX,DMO',
        'EAX,IRK',
        'SGF,SGF',
        'SGF,JLN',
        'SGF,UNO',
        'SGF,VIH',
        'ARX,RST',
        'ARX,LSE',
        'ARX,OVS',
        'DMX,DSM',
        'DMX,ALO',
        'DMX,MCW',
        'DMX,OTM',
        'DMX,MIW',
        'DMX,LWD',
        'DMX,AMW',
        'DMX,EST',
        'MQT,MQT',
        'MQT,ANJ',
        'DLH,DLH',
        'DLH,INL',
        'DLH,BRD',
        'DLH,HIB',
        'DLH,ASX',
        'DLH,MSP',
        'DLH,MPX',
        'DLH,STC',
        'DLH,FGF',
        'DLH,EAU',
        'DLH,GRB',
        'DLH,MQT',
        'GRB,GRB',
        'GRB,MFI',
        'GRB,OSH',
        'GRB,RHI',
        'GRB,AUW',
        'GRB,ISW',
        'GRB,DLH',
        'GRB,LSE',
        'GRB,MSN',
        'GRB,MQT',
        'GRB,MKE',
        'GRB,MSP',
        'DVN,BRL',
        'DVN,CID',
        'DVN,DVN',
        'DVN,DBQ',
        'DVN,IOW',
        'DVN,MLI',
        'PAH,PAH',
        'PAH,EVV',
        'PAH,CGI',
        'PAH,MDH',
        'PAH,POF',
        'PAH,OWB',
        'LSX,STL',
        'LSX,COU',
        'LSX,UIN',
        'LSX,JEF',
        'LSX,SUS',
        'LSX,SET',
        'LSX,CPS',
        'ILX,PIA',
        'ILX,SPI',
        'ILX,BMI',
        'ILX,CMI',
        'ILX,DEC',
        'ILX,LWV',
        'ILX,ILX',
        'ILX,MTO',
        'LOT,ORD',
        'LOT,RFD',
        'MKX,MKE',
        'MKX,MSN',
        'APX,APN',
        'APX,GLR',
        'APX,HTL',
        'APX,ANJ',
        'APX,TVC',
        'GRR,GRR',
        'GRR,LAN',
        'GRR,MKG',
        'GRR,AZO',
        'GRR,BTL',
        'GRR,BIV',
        'GRR,JXN',
        'IWX,FWA',
        'IWX,SBN',
        'IWX,GSH',
        'IWX,IWX',
        'IWX,BEH',
        'IWX,DFI',
        'IWX,AOH',
        'IND,IND',
        'IND,LAF',
        'IND,HUF',
        'IND,MIE',
        'IND,BMG',
        'IND,GEZ',
        'IND,EYE',
        'LMK,SDF',
        'LMK,LOU',
        'LMK,LEX',
        'LMK,BWG',
        'LMK,FFT',
        'DTX,DTW',
        'DTX,FNT',
        'DTX,MBS',
        'ILN,CVG',
        'ILN,DAY',
        'ILN,CMH',
        'ILN,LHQ',
        'ILN,OSU',
        'ILN,VTA',
        'ILN,HAO',
        'ILN,MGY',
        'ILN,ILN',
        'ILN,LUK',
        'RLX,BKW',
        'RLX,CRW',
        'RLX,CKB',
        'RLX,EKN',
        'RLX,HTS',
        'RLX,PKB',
        'PBZ,PIT',
        'PBZ,MGW',
        'PBZ,ZZV',
        'PBZ,PHD',
        'PBZ,HLG',
        'PBZ,DUJ',
        'JKL,JKL',
        'JKL,LOZ',
        'CHS,CHS',
        'CHS,CXM',
        'CHS,SAV',
        'CAE,CAE',
        'CAE,CUB',
        'CAE,OGB',
        'CAE,AGS',
        'CAE,DNL',
        'GSP,AND',
        'GSP,AVL',
        'GSP,CLT',
        'GSP,GSP',
        'GSP,HKY',
        'MRX,CHA',
        'MRX,TYS',
        'MRX,TRI',
        'MRX,OQT',
        'RNK,RNK',
        'RNK,ROA',
        'RNK,LYH',
        'RNK,DAN',
        'RNK,BLF',
        'ILM,ILM',
        'ILM,FLO',
        'ILM,LBT',
        'ILM,CRE',
        'RAH,GSO',
        'RAH,RDU',
        'RAH,FAY',
        'MHX,MRH',
        'MHX,HSE',
        'MHX,EWN',
        'AKQ,RIC',
        'AKQ,ORF',
        'AKQ,OFP',
        'AKQ,AKQ',
        'AKQ,PHF',
        'AKQ,WAL',
        'AKQ,ECG',
        'AKQ,SBY',
        'AKQ,OXB',
        'LWX,DCA',
        'LWX,BWI',
        'LWX,DMH',
        'LWX,IAD',
        'LWX,CHO',
        'LWX,MRB',
        'LWX,NAK',
        'LWX,HGR',
        'CLE,CLE',
        'CLE,TOL',
        'CLE,MFD',
        'CLE,CAK',
        'CLE,YNG',
        'CLE,ERI',
        'BUF,BUF',
        'BUF,ROC',
        'BUF,ART',
        'CTP,MDT',
        'CTP,IPT',
        'CTP,AOO',
        'CTP,BFD',
        'CTP,JST',
        'OKX,NYC',
        'OKX,LGA',
        'OKX,JFK',
        'OKX,ISP',
        'OKX,BDR',
        'OKX,EWR',
        'PHI,ABE',
        'PHI,ACY',
        'PHI,55N',
        'PHI,GED',
        'PHI,PHL',
        'PHI,RDG',
        'PHI,TTN',
        'PHI,ILG',
        'PHI,MPO',
        'BGM,BGM',
        'BGM,SYR',
        'BGM,AVP',
        'ALY,ALB',
        'ALY,GFL',
        'ALY,POU',
        'ALY,DDH',
        'ALY,PSF',
        'BTV,BTV',
        'BTV,MPV',
        'BTV,1V4',
        'BTV,MVL',
        'BTV,VSF',
        'BTV,RUT',
        'BTV,PBG',
        'BTV,SLK',
        'BTV,MSS',
        'BOX,BOS',
        'BOX,BDL',
        'BOX,PVD',
        'BOX,ORH',
        'GYX,PWM',
        'GYX,GYX',
        'GYX,MHT',
        'GYX,AUG',
        'CAR,BGR',
        'CAR,CAR',
        'CAR,HUL',
        'CAR,MLT',
        'CAR,FVE'
    ]

    #LZK LZK has an issue, maybe off by one row, number 377

    #Total Length is 851    
    for i in range(len(CF6_ACRONYMS)):
        if(i > 840 and i <= 841):
            acronym_split = CF6_ACRONYMS[i].split(',')
            NWS_PROVIDER =  acronym_split[0]
            CITY_CODE =  acronym_split[1]
            print(NWS_PROVIDER, " ", CITY_CODE, " ", i) 
            

            START_VERSION = 1
            END_VERSION = 50
            CURRENT_MONTH_NUM = int(datetime.datetime.now().strftime("%m"))

            #GREENVILLE, SC     - GSP GSP
            #NWS_PROVIDER = "GSP"    
            #CITY_CODE = "GSP"

            os.makedirs(os.path.join(NWS_PROVIDER, CITY_CODE), exist_ok=True)
            #print("CURRENT PATH: ", os.getcwd())


            #This is the starting version number for the CF6 model. 1 is the most current, 50 is last
            for versionNum in range(START_VERSION, END_VERSION+1):

                weatherObj = weatherRequest(NWS_PROVIDER, CITY_CODE, versionNum).find_all('pre')

                #This is the first line where the day counter starts
                start_line = 19
                line_num = 0
                weatherArr = str(weatherObj).splitlines()
                dailyArr = []

                #This adds all valid day entries in the GlosseryProduct class (Text Block)
                for line in weatherArr:
                    if line_num >= start_line:
                        try:
                            if line[0] == '=':
                                break
                            else:
                                dailyArr.append(convertLineToDict(line))
                        except:
                            pass
                    elif line_num == 7:
                        #Month
                        month = month_name_to_num(line.partition(':')[2].strip())

                    elif line_num == 8:
                        #Year
                        year = line.partition(':')[2].strip()

                    elif line_num == 9:
                        #Latitude
                        latitude = line.partition(':')[2].strip().replace(" ", "'")

                        #print(latitude.replace(" ", "'"))
                    elif line_num == 10:
                        #Longitude
                        longitude = line.partition(':')[2].strip().replace(" ", "'")
                    
                    line_num += 1

                
                numMaxTemp = 0
                numMinTemp = 0
                numAvgTemp = 0
                numDepTemp = 0
                numHDD = 0
                numCDD = 0
                numPrecip = 0
                numSnow = 0
                numSnowDepth = 0
                numAvgWind = 0
                numMaxWind = 0
                numSunlight = 0
                numWindDir = 0
                conditions = ''

                #file = open(f"{NWS_PROVIDER}_{CITY_CODE}_{month}_{year}_{latitude}_{longitude}.txt", "w")
                #sys.stdout = file

                csv_file = f"{NWS_PROVIDER}_{CITY_CODE}_{year}_{month}_{latitude}_{longitude}.csv"
                #path = f"C:\\Users\\hunte\\OneDrive\\Desktop\\NWS PROJECT\\{NWS_PROVIDER}\\{CITY_CODE}\\"
                path = f"{os.getcwd()}\\{NWS_PROVIDER}\\{CITY_CODE}\\"
                with open(path + csv_file, 'w', newline='') as csvfile:
                    writer = csv.writer(csvfile)
                    writer.writerow(['DY', 'MAX', 'MIN', 'AVG', 'DEP', 'HDD', 'CDD', 'WTR', 'SNW', 'DPTH', 'AVG SPD', 'MAX SPD', 'DIR', 'S-S', 'DR', 'WX'])

                    for i in range(len(dailyArr)):
                        try:
                            numMaxTemp = int(dailyArr[i]["MAX"].replace('M','-99'))
                            numMinTemp = int(dailyArr[i]["MIN"].replace('M','-99'))
                            numAvgTemp = int(dailyArr[i]["AVG"].replace('M','-99'))
                            numDepTemp = int(dailyArr[i]["DEP"].replace('M','0'))
                            numHDD = int(dailyArr[i]["HDD"].replace('M','0'))
                            numCDD = int(dailyArr[i]["CDD"].replace('M','0'))
                            numPrecip = float(dailyArr[i]["WTR"].replace('T','0.01').replace('M','0'))
                            numSnow = float(dailyArr[i]["SNW"].replace('T','0').replace('M','0'))
                            numSnowDepth = int(dailyArr[i]["DPTH"].replace('T','0').replace('M','0'))
                            numAvgWind = float(dailyArr[i]["ASPD"].replace('M','0'))
                            numMaxWind = int(dailyArr[i]["MSPD"].replace('M','0'))
                            numSunlight = int(dailyArr[i]["S-S"].replace('M','-10'))
                            numWindDir = int(dailyArr[i]["DR"].replace('M','1'))
                            conditions = dailyArr[i]["WX"].replace('M','0').replace('','0')

                        except ValueError as e:
                            #sys.stdout = original_stdout
                            print("ERROR: DAY ",i+1, e)
                            #sys.stdout = file
                            pass
                        
                        row = [i+1, numMaxTemp,numMaxTemp, numMinTemp,numAvgTemp,numDepTemp,numHDD,numCDD,numPrecip,numSnow,numSnowDepth,numAvgWind,numMaxWind,numSunlight,numWindDir,conditions]

                        writer.writerow(row)    
                        
                        
                    #print("DAY:", trunc_str(i + 1), "MAX:", trunc_str(numMaxTemp), "MIN:", trunc_str(numMinTemp), "AVG:", trunc_str(numAvgTemp), "DEP:", trunc_str(numDepTemp), "HDD:", trunc_str(numHDD), "CDD:", trunc_str(numCDD), "PRECIP:", trunc_str(numPrecip), "SNOW:", trunc_str(numSnow), "SNOW DEPTH:", trunc_str(numSnowDepth), "AVG SPD:", trunc_str(numAvgWind), "GUST SPD:", trunc_str(numMaxWind), "WIND DIR:", trunc_str(numWindDir), "S-S%:", trunc_str(1-(numSunlight/10)), "CONDITIONS:", conditions)
                
                
            #file.close()
            #sys.stdout = original_stdout

            print("SUCCESSFULLY PRINTED TO FILE")

if __name__ == "__main__":
    main()