import React, { useState, useRef, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  ScheduleComponent,
  WorkWeek,
  Month,
  Agenda,
  Inject,
  ViewsDirective,
  ViewDirective,
} from '@syncfusion/ej2-react-schedule';
import { isNullOrUndefined, createElement } from '@syncfusion/ej2-base';
import moment from 'moment';
import { db } from '../services/firebase';
import './CalendarTable.scss';
import Dialog from '@material-ui/core/Dialog';

import {
  TextField,
  Button,
  MenuItem,
  DialogActions,
  DialogTitle,
  DialogContent,
  Typography,
} from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
}));

const CalendarTable = ({ user }) => {
  const classes = useStyles();
  const [data, setData] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [initialVal, setInitialVal] = useState('');
  const [classIdVal, setClassIdVal] = useState('');
  const [majorVal, setMajorVal] = useState('');
  const [startTimeVal, setStartTimeVal] = useState('');
  const [bookedLesson, setBookedLesson] = useState({ Subject: '' });

  const scheduleObj = useRef(null);
  const startTime = useRef(null);
  const endTime = useRef(null);
  const major = useRef(null);
  const classID = useRef(null);
  const initial = useRef(null);

  useEffect(() => {
    db.collection('Events')
      .get()
      .then((querySnapshot) => {
        const tmpData = querySnapshot.docs.map((doc) => {
          const tmp = doc.data();
          tmp.Id = doc.id;
          tmp.IsReadonly = true;
          if (user && tmp.Teacher === user.uid) {
            tmp.IsReadonly = false;
          }
          return tmp;
        });
        console.log(tmpData);
        setData(tmpData);
      });
    scheduleObj.current.refresh();
    scheduleObj.current.refreshEvents();
  }, [scheduleObj, bookedLesson, user]);

  const onActionBegin = (args) => {
    console.log(scheduleObj.current);

    if (args.requestType === 'eventCreate' && args.data.length > 0) {
      args.cancel = !scheduleObj.current.isSlotAvailable(
        startTime.current.value,
        endTime.current.value
      );
    }
    console.log(args);
    if (
      !args.cancel &&
      args.requestType === 'eventCreate' &&
      !isNullOrUndefined(args.data[0]) &&
      !isNullOrUndefined(initial.current.value) &&
      (major.current.value &&
        classID.current.value &&
        initial.current.value) !== ''
    ) {
      db.collection('Events')
        .where('Teacher', '==', user.uid)
        .get()
        .then((snapshot) => {
          console.log(snapshot.docs);
          console.log(snapshot.docs.length === 0);
          if (snapshot.docs.length === 0) {
            console.log(args);
            const ref = db.collection('Events').doc();
            args.data[0].Id = ref.id;
            if (!isNullOrUndefined(args.data[0].Id)) {
              args.data[0].Major = major.current.value;
              args.data[0].ClassID = classID.current.value;
              args.data[0].Initial = initial.current.value;
              args.data[0].Subject = `${classID.current.value}${major.current.value}${initial.current.value}`;
              args.data[0].StartTime = moment(startTime.current.value).format();
              args.data[0].EndTime = moment(endTime.current.value).format();

              db.collection('Events')
                .doc(args.data[0].Id)
                .set(
                  {
                    Major: major.current.value,
                    ClassID: classID.current.value,
                    Initial: initial.current.value,
                    Subject: `${classID.current.value}${major.current.value}${initial.current.value}`,
                    StartTime: moment(startTime.current.value).format(),
                    EndTime: moment(endTime.current.value).format(),
                    Teacher: user.uid,
                    createdAt: moment().toString(),
                  },
                  { merge: true }
                )
                .then(() => {
                  console.log('Document successfully written!');
                  scheduleObj.current.refreshEvents();
                })
                .catch(function (error) {
                  console.error('Error writing document: ', error);
                });
            }
          } else {
            const tmpBooked = snapshot.docs[0].data();
            tmpBooked.Id = snapshot.docs[0].id;
            setBookedLesson(tmpBooked);
            console.log(tmpBooked);
            snapshot.forEach((doc) => {
              // doc.data() is never undefined for query doc snapshots
              console.log(doc.id, ' => ', doc.data());
            });
            setModalOpen(true);
          }
        })
        .catch((error) => {
          console.log('Error getting documents: ', error);
        });
    }

    if (args.requestType === 'eventRemove' && args.deletedRecords[0]) {
      console.log(args);
      db.collection('Events')
        .doc(args.deletedRecords[0].Id)
        .delete()
        .then(function () {
          console.log('Document successfully deleted!');
          args.cancel = true;
        })
        .catch(function (error) {
          console.error('Error removing document: ', error);
        });
    }
  };

  const onPopupOpen = (args) => {
    console.log(args.type);
    console.log(args);
    args.duration = 30;
    setStartTimeVal(args.data.StartTime);

    if (args.type === 'QuickInfo' && isNullOrUndefined(args.data.Id)) {
      const dialogObj = args.element.ej2_instances[0];
      dialogObj.hide();

      const currentAction = args.target.classList.contains('e-work-cells')
        ? 'Add'
        : 'Save';
      scheduleObj.current.openEditor(args.data, currentAction);
      console.log(scheduleObj);
    }
  };

  const onRenderCell = (args) => {
    if (args.elementType === 'workCells') {
      const hour = args.date.getHours();
      const min = args.date.getMinutes();
      const day = args.date.getDay();
      if (
        (hour === 8 && (min === 15 || min === 45)) ||
        (hour === 9 && min === 15) ||
        (hour === 10 && (min === 0 || min === 30)) ||
        (hour === 11 && (min === 0 || min === 45)) ||
        (hour === 12 && min === 15)
      ) {
        // if (args.element.dataset.date.toString() === moment(date).valueOf().toString()) {
        args.element.style.borderBottom = '0px';
        // }
      } else {
        const dateStr = args.element.dataset.date;
        args.element.dataset.date = (parseInt(dateStr) - 900000).toString();
      }
      let period = null;
      let teacher = null;
      const time = [hour, min];
      const fullDate = [day, hour, min];
      switch (time.toString()) {
        case '8,15':
          period = 1;
          break;
        case '8,45':
          period = 2;
          break;
        case '9,15':
          period = 3;
          break;
        case '10,0':
          period = 4;
          break;
        case '10,30':
          period = 5;
          break;
        case '11,0':
          period = 6;
          break;
        case '11,45':
          period = 7;
          break;
        case '12,15':
          period = 8;
          break;
        default:
          break;
      }

      switch (fullDate.toString()) {
        // Monday
        case '1,8,30':
          teacher = '林 貞 關 麥 蒙 嫻 芬 慕';
          break;
        case '1,9,0':
          teacher = '林 貞 關 麥 嫻 芬';
          break;
        case '1,9,30':
          teacher = '林 吳 貞 麥 嫻';
          break;
        case '1,10,15':
          teacher = '林 吳 貞 麥 蒙 嫻 銳';
          break;
        case '1,10,45':
          teacher = '林 吳 貞 關 嫻 銳 芬 湯';
          break;
        case '1,11,15':
          teacher = '嫻 湯 慕';
          break;
        case '1,12,0':
          teacher = '吳 關 蒙 湯 慕';
          break;
        case '1,12,30':
          teacher = '吳 關 蒙 湯 慕';
          break;
        // Tuesday
        case '2,8,30':
          teacher = '林 貞 麥 芬 湯 慕';
          break;
        case '2,9,0':
          teacher = '林 貞 關 麥 蒙 嫻 芬 湯';
          break;
        case '2,9,30':
          teacher = '林 貞 麥 蒙';
          break;
        case '2,10,15':
          teacher = '林 吳 貞 麥 嫻 慕';
          break;
        case '2,10,45':
          teacher = '吳 關 麥 嫻 慕';
          break;
        case '2,11,15':
          teacher = '吳 麥 蒙 嫻';
          break;
        case '2,12,0':
          teacher = '林 貞 蒙 嫻 銳 芬 湯';
          break;
        case '2,12,30':
          teacher = '關 蒙 嫻 銳 湯 慕';
          break;
        // Wednesday
        case '3,8,30':
          teacher = '貞 麥 嫻 芬';
          break;
        case '3,9,0':
          teacher = '貞 蒙 嫻 湯';
          break;
        case '3,9,30':
          teacher = '林 關 蒙 湯 慕';
          break;
        case '3,10,15':
          teacher = '林 蒙 銳 湯';
          break;
        case '3,10,45':
          teacher = '林 吳 貞 關 麥 銳 芬 慕';
          break;
        case '3,11,15':
          teacher = '林 貞 關 麥 嫻 銳';
          break;
        case '3,12,0':
          teacher = '';
          break;
        case '3,12,30':
          teacher = '';
          break;
        // Thursday
        case '4,8,30':
          teacher = '林 貞 麥 蒙 芬 湯 慕';
          break;
        case '4,9,0':
          teacher = '林 貞 關 麥 蒙 嫻 芬 湯';
          break;
        case '4,9,30':
          teacher = '吳 關 麥 銳 芬 湯';
          break;
        case '4,10,15':
          teacher = '吳 貞 麥 嫻 慕';
          break;
        case '4,10,45':
          teacher = '林 嫻 慕';
          break;
        case '4,11,15':
          teacher = '林 蒙 嫻 銳';
          break;
        case '4,12,0':
          teacher = '林 吳 貞 關 蒙 銳 湯 慕';
          break;
        case '4,12,30':
          teacher = '林 吳 貞 關 蒙 湯 慕';
          break;
        // Friday
        case '5,8,30':
          teacher = '林 貞 關 麥 蒙 嫻 芬';
          break;
        case '5,9,0':
          teacher = '貞 關 蒙 嫻 芬 湯 慕';
          break;
        case '5,9,30':
          teacher = '吳 關 湯 慕';
          break;
        case '5,10,15':
          teacher = '林 麥 銳 慕';
          break;
        case '5,10,45':
          teacher = '林 貞 嫻 銳 慕';
          break;
        case '5,11,15':
          teacher = '林 貞 蒙 銳 湯';
          break;
        case '5,12,0':
          teacher = '課外活動';
          break;
        case '5,12,30':
          teacher = '課外活動';
          break;
        default:
          break;
      }

      switch (time.toString()) {
        case '8,15':
          period = 1;
          break;
        case '8,45':
          period = 2;
          break;
        case '9,15':
          period = 3;
          break;
        case '10,0':
          period = 4;
          break;
        case '10,30':
          period = 5;
          break;
        case '11,0':
          period = 6;
          break;
        case '11,45':
          period = 7;
          break;
        case '12,15':
          period = 8;
          break;
        default:
          break;
      }

      if (!isNullOrUndefined(period)) {
        let ele = createElement('Typography', {
          innerHTML: `第${period}節`,
        });
        args.element.appendChild(ele);
      } else if (!isNullOrUndefined(teacher)) {
        let eleTeacher = createElement('Typography', {
          innerHTML: teacher,
        });
        args.element.appendChild(eleTeacher);
      }
    }
  };

  const editorTemplate = (props) => {
    return props !== undefined ? (
      <form>
        <TextField
          required
          id='Initial'
          data-name='initial'
          value={isNullOrUndefined(props.Initial) ? initialVal : props.Initial}
          error={!props.Initial && initialVal === ''}
          onChange={(e) => {
            e.preventDefault();
            setInitialVal(e.target.value);
          }}
          disabled={!isNullOrUndefined(props.Initial)}
          label=' 老師代號'
          defaultValue={isNullOrUndefined(props.Initial) ? '' : props.Initial}
          inputRef={initial}
          select
          className={classes.formControl}
          helperText='請選擇您的代號'
          variant='outlined'
        >
          <MenuItem value='林'>林</MenuItem>
          <MenuItem value='吳'>吳</MenuItem>
          <MenuItem value='貞'>貞</MenuItem>
          <MenuItem value='關'>關</MenuItem>
          <MenuItem value='麥'>麥</MenuItem>
          <MenuItem value='嫻'>嫻</MenuItem>
          <MenuItem value='銳'>銳</MenuItem>
          <MenuItem value='芬'>芬</MenuItem>
          <MenuItem value='湯'>湯</MenuItem>
          <MenuItem value='慕'>慕</MenuItem>
          <MenuItem value='蒙'>蒙</MenuItem>
          <MenuItem value='青'>青</MenuItem>
          <MenuItem value='謙'>謙</MenuItem>
          <MenuItem value='蘭'>蘭</MenuItem>
          <MenuItem value='美'>美</MenuItem>
          <MenuItem value='張'>張</MenuItem>
          <MenuItem value='晉'>晉</MenuItem>
          <MenuItem value='何'>何</MenuItem>
          <MenuItem value='冼'>冼</MenuItem>
          <MenuItem value='英'>英</MenuItem>
          <MenuItem value='基'>基</MenuItem>
          <MenuItem value='綺'>綺</MenuItem>
          <MenuItem value='寶'>寶</MenuItem>
          <MenuItem value='黃'>黃</MenuItem>
          <MenuItem value='洪'>洪</MenuItem>
          <MenuItem value='許'>許</MenuItem>
          <MenuItem value='玲'>玲</MenuItem>
          <MenuItem value='胡'>胡</MenuItem>
          <MenuItem value='華'>華</MenuItem>
          <MenuItem value='蕭'>蕭</MenuItem>
          <MenuItem value='君'>君</MenuItem>
          <MenuItem value='秀'>秀</MenuItem>
          <MenuItem value='韋'>韋</MenuItem>
          <MenuItem value='葉'>葉</MenuItem>
          <MenuItem value='廖'>廖</MenuItem>
          <MenuItem value='龔'>龔</MenuItem>
          <MenuItem value='陳'>陳</MenuItem>
          <MenuItem value='瑜'>瑜</MenuItem>
          <MenuItem value='盧'>盧</MenuItem>
          <MenuItem value='孫'>孫</MenuItem>
          <MenuItem value='曾'>曾</MenuItem>
          <MenuItem value='鄧'>鄧</MenuItem>
          <MenuItem value='倩'>倩</MenuItem>
          <MenuItem value='淳'>淳</MenuItem>
          <MenuItem value='賴'>賴</MenuItem>
          <MenuItem value='Tessa'>Tessa</MenuItem>
        </TextField>
        <TextField
          required
          id='ClassID'
          data-name='classID'
          value={isNullOrUndefined(props.ClassID) ? classIdVal : props.ClassID}
          error={!props.ClassID && classIdVal === ''}
          onChange={(e) => {
            e.preventDefault();
            setClassIdVal(e.target.value);
          }}
          disabled={!isNullOrUndefined(props.ClassID)}
          label='班別'
          defaultValue={isNullOrUndefined(props.ClassID) ? '' : props.ClassID}
          inputRef={classID}
          select
          className={classes.formControl}
          helperText='請選擇班別'
          variant='outlined'
        >
          <MenuItem value='1A'>1A</MenuItem>
          <MenuItem value='1B'>1B</MenuItem>
          <MenuItem value='1C'>1C</MenuItem>
          <MenuItem value='1D'>1D</MenuItem>
          <MenuItem value='2A'>2A</MenuItem>
          <MenuItem value='2B'>2B</MenuItem>
          <MenuItem value='2C'>2C</MenuItem>
          <MenuItem value='2D'>2D</MenuItem>
          <MenuItem value='3A'>3A</MenuItem>
          <MenuItem value='3B'>3B</MenuItem>
          <MenuItem value='3C'>3C</MenuItem>
          <MenuItem value='3D'>3D</MenuItem>
          <MenuItem value='4A'>4A</MenuItem>
          <MenuItem value='4B'>4B</MenuItem>
          <MenuItem value='4C'>4C</MenuItem>
          <MenuItem value='4D'>4D</MenuItem>
          <MenuItem value='5A'>5A</MenuItem>
          <MenuItem value='5B'>5B</MenuItem>
          <MenuItem value='5C'>5C</MenuItem>
          <MenuItem value='5D'>5D</MenuItem>
          <MenuItem value='6A'>6A</MenuItem>
          <MenuItem value='6B'>6B</MenuItem>
          <MenuItem value='6C'>6C</MenuItem>
          <MenuItem value='6D'>6D</MenuItem>
        </TextField>
        <TextField
          required
          id='Major'
          label='科目'
          defaultValue={isNullOrUndefined(props.Major) ? '' : props.Major}
          value={isNullOrUndefined(props.Major) ? majorVal : props.Major}
          error={!props.Major && majorVal === ''}
          onChange={(e) => {
            e.preventDefault();
            setMajorVal(e.target.value);
          }}
          disabled={!isNullOrUndefined(props.Major)}
          // onChange={(e) => {e.preventDefault();setClassIdVal(e.target.value);}}

          inputRef={major}
          select
          // fullWidth
          className={classes.formControl}
          helperText='請選擇科目'
          variant='outlined'
        >
          <MenuItem value='中'>中</MenuItem>
          <MenuItem value='英'>英</MenuItem>
          <MenuItem value='數'>數</MenuItem>
          <MenuItem value='常'>常</MenuItem>
          <MenuItem value='視'>視</MenuItem>
          <MenuItem value='音'>音</MenuItem>
          <MenuItem value='體'>體</MenuItem>
          <MenuItem value='普'>普</MenuItem>
          <MenuItem value='電'>電</MenuItem>
          <MenuItem value='圖'>圖</MenuItem>
        </TextField>

        <TextField
          fullWidth
          id='StartTime'
          label='開始時間'
          type='datetime-local'
          className={classes.formControl}
          disabled
          inputRef={startTime}
          value={moment(startTimeVal).format('YYYY-MM-DDTHH:mm')}
          InputLabelProps={{
            shrink: true,
          }}
          variant='outlined'
          inputProps={{
            step: 900,
          }}
        />
        <TextField
          fullWidth
          id='EndTime'
          label='完結時間'
          inputRef={endTime}
          className={classes.formControl}
          type='datetime-local'
          disabled
          value={moment(startTimeVal)
            .add(30, 'minutes')
            .format('YYYY-MM-DDTHH:mm')}
          InputLabelProps={{
            shrink: true,
          }}
          variant='outlined'
          inputProps={{
            step: 900,
          }}
        />
      </form>
    ) : (
      <div></div>
    );
  };

  const handleModalOk = () => {
    setModalOpen(false);
    db.collection('Events')
      .doc(bookedLesson.Id)
      .delete()
      .then(function () {
        console.log('Document successfully deleted!');
        setBookedLesson({ Subject: '' });
        scheduleObj.current.refresh();
      })
      .catch(function (error) {
        console.error('Error removing document: ', error);
      });
  };

  return (
    <>
      <ScheduleComponent
        width='80vw'
        height='90vh'
        ref={scheduleObj}
        currentView='WorkWeek'
        selectedDate={new Date(2021, 0, 18)}
        startHour='8:00'
        endHour='13:00'
        workHours={{
          highlight: false,
        }}
        timeScale={{ enable: true, interval: 30, slotCount: 2 }}
        allowDragAndDrop={false}
        allowResizing={false}
        eventSettings={{
          dataSource: data,
        }}
        // showTimeIndicator={true}
        minDate={new Date(2021, 0, 18)}
        maxDate={new Date(2021, 1, 12)}
        quickInfoTemplates={{
          content: editorTemplate.bind(this),
        }}
        editorTemplate={editorTemplate.bind(this)}
        actionBegin={onActionBegin.bind(this)}
        popupOpen={onPopupOpen.bind(this)}
        // popupClose={onPopupClose.bind(this)}
        renderCell={onRenderCell.bind(this)}
      >
        <ViewsDirective>
          <ViewDirective option='WorkWeek' />
          <ViewDirective option='Month' showWeekend={false} readonly={true} />
          <ViewDirective option='Agenda' readonly={true} />
        </ViewsDirective>
        <Inject services={[WorkWeek, Month, Agenda]} />
      </ScheduleComponent>
      <Dialog
        disableBackdropClick
        disableEscapeKeyDown
        maxWidth='xs'
        // onEntering={handleEntering}
        aria-labelledby='confirmation-dialog-title'
        open={modalOpen}
        // {...other}
      >
        <DialogTitle id='confirmation-dialog-title'>警告</DialogTitle>
        <DialogContent dividers>
          <Typography>
            已預約課堂，如需更改日期時間，請先刪除以下課堂：
          </Typography>
          <Typography>{bookedLesson.Subject}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            autoFocus
            onClick={() => setModalOpen(false)}
            // color='primary'
          >
            返回
          </Button>
          <Button onClick={() => handleModalOk()} color='primary'>
            立即刪除
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CalendarTable;
