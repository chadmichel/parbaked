import { Component, OnInit, ViewChild } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DynamicFormData } from '../dtos/dynamic-form-data';
import { CommanderService } from '../services/commander.service';
import { MatTable } from '@angular/material/table';
import { BehaviorSubject } from 'rxjs';
import { JsonpClientBackend } from '@angular/common/http';

@Component({
  selector: 'app-dynamic-form',
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.scss'],
})
export class DynamicFormComponent implements OnInit {
  data: DynamicFormData;

  entity: string;
  id: string;
  provider: string;
  form = this.fb.group({});
  rows: FormArray = this.fb.array([]);
  loaded = false;

  tableData = new BehaviorSubject<AbstractControl[]>([]);

  @ViewChild(MatTable) matTable: MatTable<any>;

  dataFieldName = 'data.record.first';

  constructor(
    private route: ActivatedRoute,
    private cdRef: ChangeDetectorRef,
    private fb: FormBuilder,
    private commander: CommanderService
  ) {}

  ngAfterViewChecked() {
    this.cdRef.detectChanges();
  }

  ngOnInit(): void {}

  async ngAfterViewInit() {
    this.entity = this.route.snapshot.paramMap.get('entity');
    this.id = this.route.snapshot.paramMap.get('id');
    this.provider = this.route.snapshot.paramMap.get('provider');

    this.data = await this.commander.processLoadCommand(this.entity, this.id);

    if (this.data == null) {
      console.log('UNABLE TO LOAD DATA');
      return;
    }

    //this.rows = this.data.record['contactLinks'];
    for (const section of this.data.sections) {
      if (section.sectionType == 'links') {
        const linkRows = this.data.record[section.sectionData];
        let index = 0;
        linkRows.forEach((element) => {
          element.rowNumber = index;
          this.addRow(element);
          index++;
        });
      }
    }

    this.form = this.fb.group(this.data.record);
    this.form.addControl('rows', this.rows);
    this.updateTable();
    this.loaded = true;
  }

  //rowNumber = 0;

  addRow(record: any) {
    const row = this.fb.group(record);
    this.rows.push(row);

    //record.rowNumber = this.rowNumber;
    //this.rowNumber++;

    //record.rowNumber = this.rows.length - 1;

    // var array = [];
    // let index = 0;

    // if (this.rows.length > 0) {
    //   for (let index in this.rows.value) {
    //     var item = this.rows.value[index];
    //     item.rowNumber = parseInt(index);
    //     array.push(item);
    //   }
    //   record.rowNumber = array.length;
    // } else {
    //   record.rowNumber = 0;
    // }
    // array.push(record);
    // this.rows.clear();

    // for (let item of array) {
    //   const row = this.fb.group(item);
    //   this.rows.push(row);
    // }

    // for (let index in this.rows.value) {
    //   var item = this.rows.value[index];
    //   console.log(item);
    // }
  }

  removeRow(record: any) {}

  updateTable() {
    for (let index in this.rows.value) {
      var item = this.rows.value[index];
      item.rowNumber = parseInt(index);
    }

    for (let index in this.rows.value) {
      var item = this.rows.value[index];
      console.log(item);
    }

    if (this.matTable != null) {
      this.matTable.renderRows();
    }

    this.tableData.next(this.rows.controls);
  }

  async action(text: string) {
    console.log('command = ' + text);
    Object.keys(this.data.record).forEach((key, index) => {
      const control = this.form.get(key);
      if (control != null) {
        this.data.record[key] = control.value;
        console.log(JSON.stringify(control.value));
      }
      var value = this.data.record[key];
      console.log('adding field ' + key + ' ' + value + ' ' + index);
    });

    this.data.sections.forEach((section) => {
      if (section.sectionType == 'links') {
        this.data.record[section.sectionData] = [];

        this.rows.value.forEach((element) => {
          this.data.record[section.sectionData].push(element);
        });
      }
    });

    await this.commander.processActionCommand(
      text,
      this.id,
      this.entity,
      this.data.record
    );
  }

  async unlink(row: any, tableData: any) {
    for (let index in this.rows.value) {
      var item = this.rows.value[index];
      console.log(item);
    }

    if (row.value.rowNumber != undefined) {
      this.rows.removeAt(row.value.rowNumber);
    } else {
      this.rows.removeAt(this.rows.length - 1);
    }

    this.updateTable();
  }

  async addLink(tableData: any, addTemplate: any) {
    const newRow = {};
    Object.assign(newRow, addTemplate);
    this.addRow(newRow);
    this.updateTable();
  }
}
