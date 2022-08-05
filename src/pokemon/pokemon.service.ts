import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';

@Injectable()
export class PokemonService {

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
    private readonly configService:ConfigService
  ){}

 async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();
    try{
      const pokemon = await this.pokemonModel.create( createPokemonDto )
      return pokemon;
    }catch(error){
      this.handleExceptions(error);
    }
    
  }

  findAll() {
    return this.pokemonModel.find();
  }

  async findOne(id: string) {
    let pokemon : Pokemon;
    
    if ( !isNaN(+id) ){
      pokemon = await this.pokemonModel.findOne({no:id});
    }
    if (!pokemon && isValidObjectId(id)){
      pokemon = await this.pokemonModel.findById(id)
    }
    if (!pokemon){
      pokemon = await this.pokemonModel.findOne({name:id.toLowerCase().trim()});
    }
    if (!pokemon)
    throw new NotFoundException(`Pokemon with id,name or no ${id} not found.`);
    
    return pokemon;
  }

  async update(id: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemon = await this.findOne( id );
    if (updatePokemonDto.name)
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
    try{
      await pokemon.updateOne(updatePokemonDto);
    return {...pokemon.toJSON(),...updatePokemonDto};
    }catch(error){
     this.handleExceptions(error);
    }
    
  }

  async remove(id: string) {
    const {deletedCount} = await this.pokemonModel.deleteOne({_id:id});
    
    if (deletedCount === 0) throw new BadRequestException(`Pokemon with id ${id} not found`)

    
    return "ok";
    
  }

  private handleExceptions( error : any ){
     if (error.code === 11000){
        throw new BadRequestException(`Pokemon exist in DB ${JSON.stringify(error.keyValue)}`);
      }
      console.log(error);
      throw new InternalServerErrorException("Can't create Pokemon - Check server logs.")

  }
}
