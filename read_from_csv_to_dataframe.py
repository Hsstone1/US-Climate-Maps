import pandas as pd
import csv
import os
import glob
import time
import requests

def main():
    
    acronyms = get_acronyms()
    start_time = time.time()

    #First full run --- 104.13217902183533 seconds ---
    
    

    for i in range(1):
    #for i in range(len(acronyms)):

        acronym_split = acronyms[i].split(',')

        NWS_PROVIDER = "BOU"
        CITY_CODE = "CCU"
        #NWS_PROVIDER = acronym_split[0]
        #CITY_CODE = acronym_split[1]

        df, num_entries = df_from_csv(NWS_PROVIDER, CITY_CODE)
        
        #lat, lon = conv_coord_to_dec(df.iloc[0]['LAT'], df.iloc[0]['LON'])

        #print(df)
        #print(get_weather_on_date(df, "07-04-2019"))
        #print_monthly_weather(get_monthly_weather(df, "12"))
        #print_annual_weather(df, num_entries)
        


    print("--- %s seconds ---" % (time.time() - start_time))



def df_from_csv(NWS_PROVIDER, CITY_CODE):
    
    path = f"{os.getcwd()}\\STATIONS\\{NWS_PROVIDER}\\{CITY_CODE}\\"
    print(NWS_PROVIDER, CITY_CODE)

    files = glob.glob(path + "*.csv")
    df = []
    num_entries = 0
    months = []
    years = []
    lats = []
    longs = []

    
    #This takes all csv files in each subdirectory, and concats them into one dataframe
    for f in files:
        csv_file = pd.read_csv(f)
        
        # This splits the csv file at _ delimeter, excluding the 4 characters of '.csv'
        # which keeps year, month, lat, lon
        csv_data = (f[:-4].split('_')[2:])
        
        # Fills out arrays so they can be added to dataframe rows. 
        # Results in easier querrying for exact day 
        for i in range(len(csv_file)):
            years.append(csv_data[0])
            months.append(csv_data[1])
            lats.append(csv_data[2])
            longs.append(csv_data[3])
        
        df.append(csv_file)
        num_entries+= 1
    
    df = pd.concat(df)

    
    #CSV files have duplicate MAX column, and DIR header before S-S but that is unused so it is removed
    df.columns = ['DY', 'MAX', 'MAX', 'MIN', 'AVG', 'DEP', 'HDD', 'CDD', 'WTR', 'SNW', 'DPTH', 'AVG SPD', 'MAX SPD', 'S-S', 'DR', 'WX']
    df["MONTH"] = months
    df["YEAR"] = years
    df["LAT"] = lats
    df["LON"] = longs

    #This removes the one duplicate column 'MAX'
    df = df.loc[:,~df.columns.duplicated()].copy()

    return df, num_entries


def get_station_name(NWS_PROVIDER, CITY_CODE):
    df = pd.read_csv('cf6_acronyms_complete.csv')
    return df.loc[(df['Acronym Push'] == NWS_PROVIDER) & (df['Acronym Option'] == CITY_CODE)].values


def print_station_name_to_csv(df):
    '''
    This takes from previous identifer file and adds the station name
    '''
    with open('lat_lon_identifier_elev_name.csv', 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['LAT', 'LON','NWS_PROVIDER', 'CITY_CODE', 'ELEVATION', 'STATION'])


        for i in range(len(df)):
        #for i in range(1):

            try:
                NWS_PROVIDER = df.iloc[i]['NWS_PROVIDER']
                CITY_CODE = df.iloc[i]['CITY_CODE']
                lat = df.iloc[i]['LAT']
                lon = df.iloc[i]['LON']
                elevation = df.iloc[i]['ELEVATION']
                name = get_station_name(NWS_PROVIDER, CITY_CODE)[0][2]
                #print(name)

                row = ([lat,lon,NWS_PROVIDER, CITY_CODE, elevation, name])

                print(row)
                writer.writerow(row)
                
            except requests.exceptions.JSONDecodeError:
                print("FAIL\t",row)
                pass
            pass


# Converts coordinates from csv file name to a usable decimal pair

def conv_coord_to_dec(latStr, lonStr):
    latStr = latStr.replace('-', '\'')
    lonStr = lonStr.replace('-', '\'')
    lat = latStr.split('\'')
    lon = lonStr.split('\'')
    lat = list(filter(None, lat))
    lon = list(filter(None, lon))    


    lat_dec = int(lat[0]) + (int(lat[1]) / 60)
    lon_dec = int(lon[0]) + (int(lon[1]) / 60)
    if lat[2] == 'S':
        lat_dec *= -1
    if lon[2] == 'W':
        lon_dec *= -1

    return round(lat_dec,3),round(lon_dec,3)
    

#MM-DD-YYYY format
def get_weather_on_date(df, date):
    date = date.split('-')
    print(date)
    return df.loc[(df['MONTH'] == date[0]) & (df['DY'] == int(date[1])) & (df['YEAR'] == date[2])]


def get_monthly_weather(df, month):

    return df.loc[df['MONTH'] == month]


def print_monthly_weather(df):
    monthly_high = df.loc[:, 'MAX'].mean()
    monthly_low = df.loc[:, 'MIN'].mean()
    monthly_average = df.loc[:, 'AVG'].mean()
    monthly_DEP = df.loc[:, 'DEP'].mean()
    monthly_HDD = df.loc[:, 'HDD'].sum() / 12
    monthly_CDD = df.loc[:, 'CDD'].sum() / 12
    monthly_precip = df.loc[:, 'WTR'].sum() / 12
    monthly_snow = df.loc[:, 'SNW'].sum() / 12
    monthly_snow_depth = df.loc[:, 'DPTH'].mean()
    monthly_wind = df.loc[:, 'AVG SPD'].mean()
    monthly_wind_gust = df.loc[:, 'MAX SPD'].mean()
    monthly_sunshine = df.loc[:, 'S-S'].mean()
    monthly_wind_dir = df.loc[:, 'DR'].mean()
    percentile_90_max = df.loc[:, 'MAX'].quantile(.9)
    percentile_100_max = df.loc[:, 'MAX'].quantile(1)
    percentile_10_min = df.loc[:, 'MIN'].quantile(.1)
    percentile_00_min = df.loc[:, 'MIN'].quantile(0)

    print("percentile_100_max:\t\t{:.1f}".format(percentile_100_max))
    print("percentile_90_max:\t\t{:.1f}".format(percentile_90_max))
    print("monthly_high:\t\t\t{:.1f}".format(monthly_high))
    print("monthly_average:\t\t{:.1f}".format(monthly_average))
    print("monthly_low:\t\t\t{:.1f}".format(monthly_low))
    print("percentile_10_min:\t\t{:.1f}".format(percentile_10_min))
    print("percentile_00_min:\t\t{:.1f}".format(percentile_00_min))

    print("monthly_DEP:\t\t\t{:.1f}".format(monthly_DEP))
    print("monthly_HDD:\t\t\t{:.1f}".format(monthly_HDD))
    print("monthly_CDD:\t\t\t{:.1f}".format(monthly_CDD))
    print("monthly_precip:\t\t\t{:.1f}".format(monthly_precip))
    print("monthly_snow:\t\t\t{:.1f}".format(monthly_snow))
    print("monthly_snow_depth:\t\t{:.1f}".format(monthly_snow_depth))
    print("monthly_wind:\t\t\t{:.1f}".format(monthly_wind))
    print("monthly_wind_gust:\t\t{:.1f}".format(monthly_wind_gust))
    print("monthly_sunshine:\t\t{:.1f}".format((10-monthly_sunshine)*10))
    print("monthly_wind_dir:\t\t{:.1f}".format(monthly_wind_dir))


def print_annual_weather(df, num_entries):
    annual_high = df.loc[:, 'MAX'].mean()
    annual_low = df.loc[:, 'MIN'].mean()
    annual_average = df.loc[:, 'AVG'].mean()
    annual_DEP = df.loc[:, 'DEP'].mean()
    annual_HDD = df.loc[:, 'HDD'].sum() /  (num_entries/12)
    annual_CDD = df.loc[:, 'CDD'].sum() /  (num_entries/12)
    annual_precip = df.loc[:, 'WTR'].sum() /  (num_entries/12)
    annual_snow = df.loc[:, 'SNW'].sum() /  (num_entries/12)
    annual_snow_depth = df.loc[:, 'DPTH'].mean()
    annual_wind = df.loc[:, 'AVG SPD'].mean()
    annual_wind_gust = df.loc[:, 'MAX SPD'].mean()
    annual_sunshine = df.loc[:, 'S-S'].mean()
    annual_wind_dir = df.loc[:, 'DR'].mean()
    percentile_90_max = df.loc[:, 'MAX'].quantile(.9)
    percentile_100_max = df.loc[:, 'MAX'].quantile(1)
    percentile_10_min = df.loc[:, 'MIN'].quantile(.1)
    percentile_00_min = df.loc[:, 'MIN'].quantile(0)

    print("percentile_100_max:\t\t{:.1f}".format(percentile_100_max))
    print("percentile_90_max:\t\t{:.1f}".format(percentile_90_max))
    print("annual_high:\t\t\t{:.1f}".format(annual_high))
    print("annual_average:\t\t\t{:.1f}".format(annual_average))
    print("annual_low:\t\t\t{:.1f}".format(annual_low))
    print("percentile_10_min:\t\t{:.1f}".format(percentile_10_min))
    print("percentile_00_min:\t\t{:.1f}".format(percentile_00_min))

    print("annual_DEP:\t\t\t{:.1f}".format(annual_DEP))
    print("annual_HDD:\t\t\t{:.1f}".format(annual_HDD))
    print("annual_CDD:\t\t\t{:.1f}".format(annual_CDD))
    print("annual_precip:\t\t\t{:.1f}".format(annual_precip))
    print("annual_snow:\t\t\t{:.1f}".format(annual_snow))
    print("annual_snow_depth:\t\t{:.1f}".format(annual_snow_depth))
    print("annual_wind:\t\t\t{:.1f}".format(annual_wind))
    print("annual_wind_gust:\t\t{:.1f}".format(annual_wind_gust))
    print("annual_sunshine:\t\t{:.1f}".format((10-annual_sunshine)*10))
    print("annual_wind_dir:\t\t{:.1f}".format(annual_wind_dir))


#This zero pads the month numbers in the csv file names for equal lengths, not needed amymore
def rename_month_files(NWS_PROVIDER, CITY_CODE):
    path = f"{os.getcwd()}\\{NWS_PROVIDER}\\{CITY_CODE}\\"
    files = glob.glob(path + "*.csv")

    #This takes all csv files in each subdirectory, and concats them into one dataframe
    new_name = ""
    for f in files:
        csv_data = (f[:-4].split('_')[2:])
        if len(csv_data[1]) == 1:
            month = "0" + csv_data[1]
            new_name = f
            new_name = new_name.replace("_" + csv_data[1]+"_", "_" + month+"_")
            os.rename(f,new_name)
            

def get_acronyms():
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
    return CF6_ACRONYMS


if __name__ == "__main__":
    main()