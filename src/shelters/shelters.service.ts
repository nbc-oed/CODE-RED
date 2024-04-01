import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { response } from 'express';
import convert from 'xml-js'    // convert 메서드는 직접 import해서 억지로 끌어와야함

@Injectable()
export class SheltersService {
    constructor (private configService : ConfigService) {}

    async getShelters () {
        const seoulShelter = await this.configService.get('SHELTER_API')
        await axios.get(`http://openapi.seoul.go.kr:8088/${seoulShelter}/xml/TbEqkShelter/1/2/`)
        .then(response => {
            const xmlData = response.data   // 공공데이터라 그런지 JSON이 아닌 XML 방식
            const xmlToJsonData = convert.xml2json(xmlData, { compact: true, spaces: 4 })   // 받아온 xml 방식의 데이터를 json으로 변환, compact : true는 더욱 압축된 json 형식이고 space는 단순히 json 출력시 들여쓰기 칸 수
            const shelterDataJsonVer = JSON.parse(xmlToJsonData)    // json 문자열을 자바스크립트 객체로 변환
            const resultInRow = shelterDataJsonVer['TbEqkShelter']['row']
            const shelterInfo = resultInRow.map(element => {
                return {
                    shelterId: element.SHELTER_ID._text,    // ._text를 안 쓸 경우, shelterId : { _text:'1'} 이런식으로 표시됨
                    address: element.DTL_ADRES._text,
                    facilityArea: element.FCLTY_AR._text,
                    longitude: element.LON._text,
                    latitude: element.LAT._text,
                    departmentNumber: element.MNGPS_NM._text
                };
            })
            return shelterInfo
        })
    }
}
