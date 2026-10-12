export function insertionSort(array) {

    const copy = [...array];

    for (let i = 1; i < copy.length; i++) {

        const value = copy[i];

        let j = i - 1;

        while (j >= 0 && copy[j] > value) {

            copy[j + 1] = copy[j];

            j--;
        }

        copy[j + 1] = value;
    }

    return copy;
}