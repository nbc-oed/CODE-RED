import { Controller } from '@nestjs/common';
import { DestinationRiskService } from './destination-risk.service';

@Controller('destination-risk')
export class DestinationRiskController {
    constructor (private readonly destinationRiskService : DestinationRiskService) {}

    
}
