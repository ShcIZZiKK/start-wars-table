class Utils {
  /**
    * Проверяет является ли значение числом
    * @param {Number/String} num - число
    * @returns {Boolean} - true - число, false - нет
    */
  static isNumeric(num) {
    // eslint-disable-next-line no-restricted-globals
    return !isNaN(num);
  }

  /**
   * Метод проверяет пустой объект или нет
   * @param {Object} object - объект проверяемый на пустоту
   * @return {Boolean} - true если пустой и false если полный
   */
  static isEmptyObject(object) {
    return object && Object.keys(object).length === 0 && object.constructor === Object;
  }

  /**
   * Сортирует данные от меньшего к большему
   * @param {Array} data - данные
   * @param {String} fieldSortNane - поле по которому сортируем
   */
  static sortAsc(data, fieldSortNane) {
    data.sort((prev, next) => {
      const prevValue = prev[fieldSortNane];
      const nextValue = next[fieldSortNane];

      if (Utils.isNumeric(prevValue) && Utils.isNumeric(nextValue)) {
        return Number(prevValue) - Number(nextValue);
      }

      if (prevValue < nextValue) {
        return -1;
      }

      return 1;
    });
  }

  /**
   * Сортирует данные от большего к меньшему
   * @param {Array} data - данные
   * @param {String} fieldSortNane - поле по которому сортируем
   */
  static sortDesc(data, fieldSortNane) {
    data.sort((prev, next) => {
      const prevValue = prev[fieldSortNane];
      const nextValue = next[fieldSortNane];

      if (Utils.isNumeric(prevValue) && Utils.isNumeric(nextValue)) {
        return Number(nextValue) - Number(prevValue);
      }

      if (nextValue < prevValue) {
        return -1;
      }

      return 1;
    });
  }
}

export default Utils;
