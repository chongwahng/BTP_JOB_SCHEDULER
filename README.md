# BTP_JOB_SCHEDULER

## Installation:

```sh
git clone https://github.com/developedbysom/BTP_JOB_SCHEDULER.git
cd BTP_JOB_SCHEDULER
```
> Deploy code to BTP space

```sh
cf login // Enter your login credentials and select your org & space
cf push // make sure you are in root folder where manifest.yml exists
```
This will above command will create deploy the application to cloud and the same you will able to find your development 
space application  area

The path to call to fetch data will be:
https://<app name>.cfapps.eu10.hana.ondemand.com/header
