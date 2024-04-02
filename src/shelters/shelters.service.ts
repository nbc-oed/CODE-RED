import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { response } from 'express';
import { Shelters } from 'src/common/entities/shelters.entity';
import { Repository } from 'typeorm';
import convert from 'xml-js'; // convert 메서드는 직접 import해서 억지로 끌어와야함

@Injectable()
export class SheltersService {
  constructor(
    private configService: ConfigService,
    @InjectRepository(Shelters)
    private sheltersRepository: Repository<Shelters>,
  ) {}

  async getShelters() {
    const seoulShelter = await this.configService.get('SHELTER_API');
    const response = await axios.get(
      `http://openapi.seoul.go.kr:8088/${seoulShelter}/xml/TbEqkShelter/1/37/`,
    );
    {
      const xmlData = response.data; // 공공데이터라 그런지 JSON이 아닌 XML 방식
      const xmlToJsonData = convert.xml2json(xmlData, { // 받아온 xml 방식의 데이터를 json으로 변환, compact : true는 더욱 압축된 json 형식이고 space는 단순히 json 출력시 들여쓰기 칸 수
        compact: true,
        spaces: 4,
      }); 
      const shelterDataJsonVer = JSON.parse(xmlToJsonData); // json 문자열을 자바스크립트 객체로 변환
      const resultInRow = shelterDataJsonVer['TbEqkShelter']['row'];
      const shelterInfo = resultInRow.map((element) => {
        return {
          id: parseInt(element.SHELTER_ID._text), // ._text를 안 쓸 경우, shelterId : { _text:'1'} 이런식으로 표시됨
          shelter_id: parseInt(element.SHELTER_ID._text),
          address: element.DTL_ADRES._text,
          facility_name: element.VT_ACMDFCLTY_NM._text,
          facility_area: element.FCLTY_AR._text,
          longitude: parseFloat(element.LON._text),
          latitude: parseFloat(element.LAT._text),
          department_number: element.MNGPS_NM._text,
        };
      });
      for (const shelters of shelterInfo) { // 처음엔 단순 if문을 사용했으나, 배열을 풀어줌으로서 여러개의 객체들에 접근 가능하게 하기 위해 for문 사용
        const findShelterData = await this.sheltersRepository.find({
        where :{
          id: shelters.id,
        }  
        });
        if (!findShelterData) {
          await this.sheltersRepository.save(shelters);
        } else {
          const findId = await this.sheltersRepository.find({
            select : {
              id : true
            }
          })
          const deleteShelters = findId.map(Shelters => Shelters.id);
          const dbMaxNumber = Math.max(...deleteShelters); // 기존 db에 있는 id중 최대값
          const apiMaxNumber = Math.max(...shelterInfo.map(shelter => shelter.id)); // 새로 불러온 api의 id중 최대값
          if ( dbMaxNumber > apiMaxNumber ) {            // 기존 db에 있는 id 갯수가 새로 불러올 갯수 보다 클 경우, 그만큼 삭제
            const spliceShelterNumber = dbMaxNumber - apiMaxNumber
          if (spliceShelterNumber > 0) {
            const sheltersToDelete = [];
            for (let i = dbMaxNumber; i > apiMaxNumber; i--) {
              sheltersToDelete.push(i);
            }
            await this.sheltersRepository.delete(sheltersToDelete);   // 대피소 데이터가 20->10, 30->15 이런식으로 줄어들 경우 해당 안되는 데이터들(대피소 아이디는 값이 정해져있기 때문에) 삭제
          }
          }
          else {  // 같거나 작다면 업데이트(save) // 성공했지만 id가 뒤죽박죽 되어버림;; => shelter_id 추가로 임시 조치 완료
            await this.sheltersRepository.save(shelters); // 여기서도 update를 쓰면 새롭게 추가되는 데이터들이 저장이 안됨
          }
          
        }
      }
      return shelterInfo
    }
  }
}
