import {Component, ViewChild} from '@angular/core';

import {MatTable} from '@angular/material/table';
import { CdkColumnDef } from '@angular/cdk/table';

import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ]
})
export class AppComponent  {

 
  @ViewChild(MatTable) table: MatTable<any>;

  gamesToPlayEach = 6;
  playersPerGame = 3;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  players = [
    'Aka: Law',
    'Roderic: Mounts',
    'Pancetta: Chaos',
    'Bos5k: Armory',
    'Eidolon: Air',
    'Ruludos: Neutral',
    'Eth: Creatures',
    'Biscuits: Growths',
    'Mazy: Marksman',
    'Iod: Undead',
    'Lardon: Attack',
    'Clef: Speed'
  ]

  playersLeftOver: Array<string> = [];

  displayedColumns = ['game','player1','player2','player3']
  dataSource : Array<Object> = [];
  doingThing = false;


  ngOnInit() {
        
  }

  doThisThing() {
    if(this.doingThing)
      return;
    this.doingThing = true;

    this.displayedColumns = ['game','player1','player2'];

    for(let c = 3; c <= this.playersPerGame; c++) {
      this.displayedColumns.push(`player${c}`)
    }

    let norberts: {
      [key:string]: number
    } = {};
    this.dataSource = [];
    this.players.forEach((p , i) => {
      // construct a list with players and the number of games
      // to be in
      // not sure how i've managed it, but I need to add 1 here otherwise everyone misses
      // a game. there's an off-by-1 error somewhere.
      norberts[p] = this.gamesToPlayEach + 1;
    })
    let g = 1;
    let gamesToGo = this.gamesToGoCount(norberts);
    while(gamesToGo !== 0) {
      let herberts = this.nextPlayers(norberts);
      let game = {
        no: g
      }
      g++;
      for(let p = 0; p < herberts.length; p++) {
        let herbert = herberts[p];
        game['player' + (p + 1)] = herbert;
        norberts[herbert]--;
        if(norberts[herbert] === 0)
          delete norberts[herbert];
      }
      if(Object.keys(norberts).length < this.playersPerGame) {
        // this might happen depending on no of players
        // and playersPerGame game values
        this.playersLeftOver = Object.keys(norberts);
        break;
      }
      this.dataSource.push(game);
      gamesToGo = this.gamesToGoCount(norberts)
    }
    
   
    
    this.table.renderRows();
    this.doingThing = false;
  }

  // sum up all the gamesToGo values so we know 
  // if there are still games to allocate
  gamesToGoCount(norberts: { [key:string]: number}) {
    let values = Object.values(norberts);
    if(values.length === 0)
      return 0;
    return values.reduce((total, value) => total + value);
  }

// select the next players for the game
  nextPlayers(norberts: {[key: string]:number}): Array<string> {
    // create an array of arrays from object properties
    let entries = Object.entries(norberts);
    // add CHAOS
    this.shuffle(entries);
    // sort by number of games to go for each player
    // the shuffled order will be kept just within
    // those that have the same number of games to go
    entries.sort((a, b) => b[1] - a[1]);
    // take the players with most games to be allocated to
    let top = entries.slice(0, this.playersPerGame);
    // just return the player names
    let p = [];
    for(let i = 0; i < this.playersPerGame; i++) {
      p.push(top[i][0])
    }
    return p;
  }

// https://medium.com/@nitinpatel_20236/how-to-shuffle-correctly-shuffle-an-array-in-javascript-15ea3f84bfb#325f
  shuffle(a: Array<any>) {
    for(let i = a.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * i)
      this.swap(a, i, j);
    }
  }

  swap(a, i, j) {
    const temp = a[i]
    a[i] = a[j]
    a[j] = temp
  }

// chip stuff
  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Add our player
    if ((value || '').trim()) {
      this.players.push(value.trim());
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  remove(player: string): void {
    const index = this.players.indexOf(player);

    if (index >= 0) {
      this.players.splice(index, 1);
    }
  }

}


