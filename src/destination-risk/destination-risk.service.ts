import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import convert from 'xml-js'

@Injectable()
export class DestinationRiskService {
    constructor (
        private configService: ConfigService,
    ) {}

    async getDestinationRisk (destination : string) {
        const seoulRealTimeData = await this.configService.get('REAL_TIME_DATA_API')
        const response = await axios.get(`http://openapi.seoul.go.kr:8088/${seoulRealTimeData}/xml/citydata/1/5/${destination}`)
        const xmlData = response.data
        const xmlToJsonData = convert.xml2json(xmlData)
        const realTimeDataJsonVer = JSON.parse(xmlToJsonData)
        const areaName = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']
        const areaCongestLvlMsg = realTimeDataJsonVer['SeoulRtd.citydat']['CITYDATA']['LIVE_PPLTN_STTS']['LIVE_PPLTN_STTS']
        const realTimeDestinationRiskData = {
             areaName,
             areaCongestLevel : areaCongestLvlMsg.AREA_CONGEST_LVL,
             areaCongestMessage : areaCongestLvlMsg.AREA_CONGEST_MSG
        }
        return realTimeDestinationRiskData
    }
}
