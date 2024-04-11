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
        const response = await axios.get(`http://openapi.seoul.go.kr:8088/${seoulRealTimeData}/xml/citydata/1/1/${destination}`)
        const xmlData = response.data
        const xmlToJsonData = convert.xml2json(xmlData, {
            compact : true,
            spaces : 4
        })
        const realTimeDataJsonVer = JSON.parse(xmlToJsonData)
        const areaName = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['AREA_NM']['_text']
        const areaCongestLvlMsg = realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['LIVE_PPLTN_STTS']['LIVE_PPLTN_STTS']
        // 인구 추이는 임의로 예측 실시간 인구 지표 최소값과 예측 실시간 인구 지표 최대값의 평균 값으로 나타내었음
        const populationTrends =
        realTimeDataJsonVer['SeoulRtd.citydata']['CITYDATA']['LIVE_PPLTN_STTS']['LIVE_PPLTN_STTS']['FCST_PPLTN']['FCST_PPLTN'][0]
        const predictedPopulation = (parseInt(populationTrends.FCST_PPLTN_MIN._text) + parseInt(populationTrends.FCST_PPLTN_MAX._text)) /2
        const realTimeDestinationRiskData = {
             '목적지' : areaName,
             '장소 혼잡도' : areaCongestLvlMsg.AREA_CONGEST_LVL._text,
             '관련 안내사항' : areaCongestLvlMsg.AREA_CONGEST_MSG._text,
             '인구 추이' : `약 ${predictedPopulation}명`
        }
        return realTimeDestinationRiskData
    }
}
