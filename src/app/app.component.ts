import {Component, ViewChild} from '@angular/core';

import {MatTable} from '@angular/material/table';
import { CdkColumnDef } from '@angular/cdk/table';

import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';

import * as _ from "lodash";

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
    // simple flag to prevent running this function more than once
    // at any given time
    if(this.doingThing)
      return;
    this.doingThing = true;

    // we always want these first 3 columns
    this.displayedColumns = ['game','player1','player2'];

    // add other player columns as necessary
    for(let c = 3; c <= this.playersPerGame; c++) {
      this.displayedColumns.push(`player${c}`)
    }
    this.playersLeftOver = [];
    let norberts: { [key:string]: number } = {};
    this.dataSource = [];
    this.players.forEach((p , i) => {
      // construct a list with players and the number of games
      // to which they can be allocated
      norberts[p] = this.gamesToPlayEach;
    })
    let gameid = 1;

    // keep track of whether there are any games still to allocate
    // and we'll keep going until none left to allocate
    let gamesToGo = this.gamesToGoCount(norberts);
    while(gamesToGo !== 0) {

      // if we have some players left but not enough to make up a game
      // we'll report it and end the process
      if(Object.keys(norberts).length < this.playersPerGame) {
        // this might happen depending on no of players
        // and playersPerGame game values
        this.playersLeftOver = Object.keys(norberts);
        break;
      }

      // get the top players with the most games that still need to be allocated
      let herberts = this.nextPlayers(norberts);
      let game = {
        no: gameid,
        // player1, player2 added here etc
      }
      gameid++;
      for(let p = 0; p < herberts.length; p++) {
        let herbert = herberts[p];
        game['player' + (p + 1)] = herbert;
        // one less game for this player to be allocated to
        norberts[herbert]--;
        // if we have no more games to allocate for this player
        // remove them from the list
        if(norberts[herbert] === 0)
          delete norberts[herbert];
      }
      
      // add this game to the table
      this.dataSource.push(game);

      gamesToGo = this.gamesToGoCount(norberts)
    }
    
    // redraw the table with the new data
    this.table.renderRows();
    // allow another click    
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
    // as we've included lodash we might as well
    // use their shuffle
    entries = _.shuffle(entries);
    console.log(entries);
    // sort by number of games to go for each player
    // the shuffled order will be kept just within
    // those that have the same number of games to go
    // using a stable sort to ensure we still keep the shuffled order
    entries = _.sortBy(entries, [(o) => -o[1]]);
    console.log(entries);
    // take the players with most games to be allocated to
    let top = entries.slice(0, this.playersPerGame);
    // just return the player names
    let p = [];
    for(let i = 0; i < this.playersPerGame; i++) {
      // unshift() to keep the order from shuffle
      p.unshift(top[i][0])
    }
    return p;
  }

// shuffle an array in place https://medium.com/@nitinpatel_20236/how-to-shuffle-correctly-shuffle-an-array-in-javascript-15ea3f84bfb#325f
  shuffle(a: Array<any>) {
    for(let i = a.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * i)
      this.swap(a, i, j);
    }
  }

  swap(a: Array<any>, i: number, j:number) {
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


