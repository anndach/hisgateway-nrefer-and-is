import * as Knex from 'knex';
import * as moment from 'moment';
const maxLimit = 250;
const hcode = process.env.HOSPCODE;

export class HisNemoModel {
    check() {
        return true;
    }

    getTableName(db: Knex, dbName = process.env.HIS_DB_NAME) {
        return db('information_schema.tables')
            .select('TABLE_NAME')
            .where('TABLE_SCHEMA', '=', dbName);
    }

    // select รายชื่อเพื่อแสดงทะเบียน
    async getReferOut(db: Knex, date, hospCode=hcode) {
        const sql=`select a.DATETIME_REFER refer_date,a.hospcode,a.hosp_destination,
                    a.REFERID as referid,
                    a.pid as hn,
                    b.CID as cid,
                    a.SEQ as seq,
                    a.an as an,
                    f.prename as prename,
                    b.NAME as fname,
                    b.LNAME as lname,
                    b.BIRTH as dob,
                    b.SEX as sex,
                    if(upper(e.pdx) is not null and e.pdx<>' ',upper(e.pdx),ifnull(c.DIAGCODE,d.DIAGCODE)) as dx
                    from nemo_refer.nrefer_refer_history a
                    left join nemo_refer.nrefer_person b on a.HOSPCODE=b.HOSPCODE and a.pid=b.PID
                    left join nemo_refer.nrefer_diagnosis_opd c on a.HOSPCODE=c.hospcode and a.SEQ=c.SEQ and c.DIAGTYPE='1'
                    left join nemo_refer.nrefer_diagnosis_ipd d on a.HOSPCODE=d.HOSPCODE and a.AN=d.AN and c.DIAGTYPE='1'
                    left join damasac.refer_out_data e on convert(a.hospcode using tis620)=b.hospcode and convert(hex(encode(a.SEQ,'nemocarethailand')) using tis620)=e.vn
                    left join nemo_refer.cprename f on b.PRENAME=f.id_prename
                    where  b.PRENAME is not null and date(a.DATETIME_REFER)="${date}"`;
        const result = await db.raw(sql);
        return result[0];
        
        // return db('hospdata.refer_out as refer')
        //     .leftJoin('hospdata.patient as pt', 'refer.hn', 'pt.hn')
            
        //     .select(db.raw('"' + hcode + '" as hospcode'))
        //     .select('refer.refer_hcode as hosp_destination',
        //         'refer.hn', 'pt.person_id as cid', 'refer.vn as seq', 'refer.an',
        //         'pt.title as prename', 'pt.name as fname', 'pt.surname as lname',
        //         'pt.birth as dob', 'pt.sex', 'refer.icd10 as dx'
        //     )
        //     .where('refer.refer_date', date)
        //     .orderBy('refer.refer_date')
        //     .limit(maxLimit);
    }

    async getPerson(db: Knex, columnName, searchText, hospCode=hcode) {

        //columnName = cid, hn
        //columnName = columnName === 'cid' ? 'no_card' : columnName;
        console.log(hospCode);
         columnName=columnName.toUpperCase();
        const sql=`select * from nrefer_person 
                    where ${columnName}="${searchText}" and hospcode="${hospCode}"`;
        const result = await db.raw(sql);
        return result[0];
        // return db('hospdata.patient')
        //     .select(db.raw('"' + hcode + '" as hospcode'))
        //     .select('hn', 'no_card as cid', 'title as prename',
        //         'name as fname', 'middlename as mname', 'surname as lname',
        //         'birth as dob', 'sex', 'address', 'moo', 'road', 'soi',
        //         'add as addcode', 'tel', 'zip', 'occupa as occupation')
        //     .where(columnName, "=", searchText)
        //     .limit(maxLimit);
    }

    async getAddress(db, columnName, searchNo, hospCode=hcode) {
        //columnName = columnName === 'cid' ? 'no_card' : columnName;
        const sql=`select * from nrefer_address 
                    where ${columnName}="${searchNo}" and hospcode="${hospCode}"`;
        const result = await db.raw(sql);
        return result[0];

        //columnName = cid, hn
        //
        // const sql=`select * from nrefer_person where ${columnName}='${searchText}'`;
        // const result = await db.raw(sql);
        // return result[0];
        // columnName = columnName === 'cid' ? 'no_card' : columnName;
        // return db('view_address')
        //     .select(db.raw('"' + hcode + '" as hospcode'))
        //     .select('*')
        //     .where(columnName, "=", searchNo)
        //     .limit(maxLimit);
    }

    async getService(db, columnName, searchNo, hospCode=hcode) {
        //columnName = visitNo, hn
        
        columnName = columnName === 'visitNo' ? 'seq' : columnName;
        columnName = columnName === 'date_serv' ? 'service.DATE_SERV' : columnName;
        const sql=`select * from nrefer_service 
                    where ${columnName}="${searchNo}" and hospcode="${hospCode}"`;
        const result = await db.raw(sql);
        return result[0];
    }

    async getDiagnosisOpd(db, visitNo, hospCode=hcode) {
        const sql=`select * from nrefer_diagnosis_opd 
                    where SEQ = "${visitNo}" and hospcode="${hospCode}"`;
        const result = await db.raw(sql);
        return result[0];
    }

    getProcedureOpd(db, visitno, hospCode=hcode) {
        return db('view_opd_op')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('vn as visitno', 'date', 'hn', 'op as op_code',
                'desc as op_name', 'icd_9 as icdcm', 'dr')
            .where('vn', "=", visitno)
            .limit(maxLimit);
    }

    getChargeOpd(db, visitNo, hospCode=hcode) {
        return db('view_opd_charge_item')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('vn', visitNo)
            .limit(maxLimit);
    }

    getLabRequest(db, columnName, searchNo, hospCode=hcode) {
        columnName = columnName === 'visitNo' ? 'vn' : columnName;
        return db('view_lab_request_item as lab')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('vn as visitno', 'lab.hn as hn', 'lab.an as an',
                'lab.lab_no as request_id',
                'lab.lab_code as lab_code',
                'lab.lab_name as lab_name',
                'lab.loinc as loinc',
                'lab.icdcm as icdcm',
                'lab.standard as cgd',
                'lab.cost as cost',
                'lab.lab_price as price',
                'lab.date as request_date')
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }

    getLabResult(db, columnName, searchNo, hospCode=hcode) {
        columnName = columnName === 'visitNo' ? 'vn' : columnName;
        return db('view_lab_result')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }

    async getDrugOpd(db, seq, hospCode=hcode) {
        const sql=`select * from nrefer_drug_opd 
            where SEQ = "${seq}" and hospcode="${hospCode}" `;
        const result = await db.raw(sql);
        return result[0];
    }

    async getAdmission(db, columnName, searchNo, hospCode=hcode) {
        const sql=`select * from nrefer_admission 
            where ${columnName}="${searchNo}" and hospcode="${hospCode}"`;
        const result = await db.raw(sql);
        return result[0];
    }

    async getDiagnosisIpd(db: Knex, an, hospCode=hcode) {
        //columnName = columnName === 'visitNo' ? 'vn' : columnName;
        const sql=`select * from nrefer_diagnosis_ipd 
                    where AN = "${an}" and hospcode="${hospCode}"`;
        const result = await db.raw(sql);
        return result[0];
    }

    getProcedureIpd(db, an, hospCode=hcode) {
        return db('procedure_ipd')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('an', an)
            .limit(maxLimit);
    }

    getChargeIpd(db, an, hospCode=hcode) {
        return db('charge_ipd')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('an', "=", an)
            .limit(maxLimit);
    }

    async getDrugIpd(db, an, hospCode=hcode) {
        const sql=`select * from nrefer_drug_ipd 
        where AN = "${an}" and hospcode="${hospCode}"`;
        const result = await db.raw(sql);
        return result[0];
    }

    async getAccident(db, visitNo, hospCode=hcode) {
        const sql=`select * from nrefer_accident 
        where SEQ = "${visitNo}" and hospcode="${hospCode}"`;
        const result = await db.raw(sql);
        return result[0];
    }

    getDrugAllergy(db, hn, hospCode=hcode) {
        return db('view_drug_allergy')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('hn', hn)
            .limit(maxLimit);
    }

    getAppointment(db, visitNo, hospCode=hcode) {
        return db('view_opd_fu')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('vn', "=", visitNo)
            .limit(maxLimit);
    }

    async getReferHistory(db, columnName, searchNo, hospCode=hcode) {
       columnName = columnName === 'visitNo' ? 'SEQ' : columnName;
        const sql=`select * from nrefer_refer_history 
                where ${columnName}="${searchNo}" and hospcode="${hospCode}"`;
        const result = await db.raw(sql);
        return result[0];
    }

    getClinicalRefer(db, referNo, hospCode=hcode) {
        return db('view_clinical_refer')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('refer_no', "=", referNo)
            .limit(maxLimit);
    }

    getInvestigationRefer(db, referNo, hospCode=hcode) {
        return db('view_investigation_refer')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('refer_no', "=", referNo)
            .limit(maxLimit);
    }

    getCareRefer(db, referNo, hospCode=hcode) {
        return db('view_care_refer')
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where('refer_no', "=", referNo)
            .limit(maxLimit);
    }

    getReferResult(db, hospDestination, referNo, hospCode=hcode) {
        return [];
    }

    getData(db, tableName, columnName, searchNo, hospCode=hcode) {
        return db(tableName)
            .select(db.raw('"' + hcode + '" as hospcode'))
            .select('*')
            .where(columnName, "=", searchNo)
            .limit(maxLimit);
    }
}
